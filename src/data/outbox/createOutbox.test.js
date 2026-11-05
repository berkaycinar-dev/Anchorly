import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, NETWORK_ERROR, TIMEOUT } from "../api/ApiError";
import createOutbox, {
  CLIENT_TIME_HEADER,
  RETRY_INTERVAL_MS,
} from "./createOutbox";
import { readOutbox } from "./outboxStorage";
import { QUEUED } from "./queued";

const NOW = new Date("2026-11-05T10:00:00.000Z");

function apiError(status, code = "SOME_ERROR") {
  return new ApiError({ status, code, message: code });
}

function networkError() {
  return apiError(0, NETWORK_ERROR);
}

function createSubject({ request, userId = "u1", entries } = {}) {
  if (entries) {
    localStorage.setItem(`outbox:${userId}`, JSON.stringify(entries));
  }

  const client = {
    request: request ?? vi.fn(() => Promise.resolve({ ok: true })),
    setAccessToken: vi.fn(),
  };
  const onSynced = vi.fn();
  const onDropped = vi.fn();
  let clock = NOW.getTime();
  const outbox = createOutbox({
    client,
    userId,
    now: () => new Date(clock),
    onSynced,
    onDropped,
  });

  return {
    client,
    outbox,
    onSynced,
    onDropped,
    tick: (ms = 1000) => {
      clock += ms;
    },
  };
}

function entry(path, time, overrides = {}) {
  return { method: "PATCH", path, body: { n: path }, time, ...overrides };
}

describe("outbox", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("requests that are not queued", () => {
    it("passes a read straight through without a time header", async () => {
      const { client, outbox } = createSubject();

      await outbox.client.request("GET", "/tasks", { signal: "s" });

      expect(client.request).toHaveBeenCalledWith("GET", "/tasks", {
        signal: "s",
      });
    });

    it.each([
      ["POST", "/auth/login"],
      ["POST", "/import"],
      ["POST", "/me/password"],
      ["DELETE", "/me"],
    ])("passes %s %s through and never queues it", async (method, path) => {
      const request = vi.fn(() => Promise.reject(networkError()));
      const { outbox } = createSubject({ request });

      await expect(outbox.client.request(method, path)).rejects.toThrow();

      expect(outbox.getSnapshot().pending).toBe(0);
      expect(request).toHaveBeenCalledWith(method, path, {});
    });

    it("keeps the other members of the client", () => {
      const { client, outbox } = createSubject();

      expect(outbox.client.setAccessToken).toBe(client.setAccessToken);
    });
  });

  describe("a write while online", () => {
    it("sends the time the change was made and returns the answer", async () => {
      const { client, outbox } = createSubject();

      const result = await outbox.client.request("PATCH", "/tasks/1", {
        body: { title: "x" },
      });

      expect(result).toEqual({ ok: true });
      expect(client.request).toHaveBeenCalledWith("PATCH", "/tasks/1", {
        body: { title: "x" },
        headers: { [CLIENT_TIME_HEADER]: NOW.toISOString() },
      });
      expect(outbox.getSnapshot()).toEqual({ pending: 0, offline: false });
    });

    it.each([
      ["/tasks/bulk", "POST"],
      ["/projects", "POST"],
      ["/routines/1/checks/2026-11-05", "PUT"],
      ["/me/settings", "PATCH"],
    ])("treats %s as a change to user data", async (path, method) => {
      const { client, outbox } = createSubject();

      await outbox.client.request(method, path, { body: {} });

      expect(client.request.mock.calls[0][2].headers).toBeDefined();
    });

    it.each([
      ["a network failure", networkError()],
      ["a timeout", apiError(0, TIMEOUT)],
      ["a gateway error", apiError(502, "BAD_GATEWAY")],
      ["a service unavailable answer", apiError(503, "UNAVAILABLE")],
      ["a gateway timeout", apiError(504, "GATEWAY_TIMEOUT")],
      ["a dev proxy error without a body", apiError(500, "UNKNOWN_ERROR")],
    ])("queues the change after %s", async (name, error) => {
      const { outbox } = createSubject({
        request: vi.fn(() => Promise.reject(error)),
      });

      const result = await outbox.client.request("POST", "/tasks", {
        body: { id: "1" },
      });

      expect(result).toBe(QUEUED);
      expect(outbox.getSnapshot()).toEqual({ pending: 1, offline: true });
      expect(readOutbox("u1")).toEqual([
        {
          method: "POST",
          path: "/tasks",
          body: { id: "1" },
          time: NOW.toISOString(),
        },
      ]);
    });

    it.each([400, 403, 422, 500])(
      "rethrows a %s answer from the API and queues nothing",
      async (status) => {
        const error = apiError(status);
        const { outbox } = createSubject({
          request: vi.fn(() => Promise.reject(error)),
        });

        await expect(
          outbox.client.request("PATCH", "/tasks/1", { body: {} }),
        ).rejects.toBe(error);

        expect(outbox.getSnapshot().pending).toBe(0);
      },
    );
  });

  describe("a write while changes are waiting", () => {
    it("queues it behind the others and does not send it directly", async () => {
      const request = vi.fn(() => Promise.reject(networkError()));
      const { outbox, tick } = createSubject({
        request,
        entries: [entry("/tasks/1", "2026-11-05T09:00:00.000Z")],
      });
      tick();

      const result = await outbox.client.request("PATCH", "/tasks/2", {
        body: { title: "b" },
      });

      expect(result).toBe(QUEUED);
      expect(outbox.getSnapshot().pending).toBe(2);
      expect(request.mock.calls.every(([, path]) => path === "/tasks/1")).toBe(
        true,
      );
    });

    it("keeps the queue in the order the changes were made", async () => {
      const request = vi.fn(() => Promise.reject(networkError()));
      const { outbox } = createSubject({ request });
      const second = outbox.client.request("PATCH", "/tasks/b", { body: {} });
      await second;

      const { outbox: other, tick } = createSubject({
        request,
        userId: "u2",
        entries: [entry("/tasks/late", "2026-11-05T11:00:00.000Z")],
      });
      tick();
      await other.client.request("PATCH", "/tasks/early", { body: {} });

      expect(readOutbox("u2").map((item) => item.path)).toEqual([
        "/tasks/early",
        "/tasks/late",
      ]);
    });
  });

  describe("sending the queue", () => {
    const FIRST = entry("/tasks/1", "2026-11-05T09:00:00.000Z");
    const SECOND = entry("/tasks/2", "2026-11-05T09:01:00.000Z", {
      method: "DELETE",
      body: undefined,
    });

    it("sends the changes in order with the time they were made", async () => {
      const { client, outbox, onSynced } = createSubject({
        entries: [FIRST, SECOND],
      });

      await outbox.flush();

      expect(client.request.mock.calls).toEqual([
        [
          "PATCH",
          "/tasks/1",
          { body: FIRST.body, headers: { [CLIENT_TIME_HEADER]: FIRST.time } },
        ],
        [
          "DELETE",
          "/tasks/2",
          { body: undefined, headers: { [CLIENT_TIME_HEADER]: SECOND.time } },
        ],
      ]);
      expect(outbox.getSnapshot()).toEqual({ pending: 0, offline: false });
      expect(readOutbox("u1")).toEqual([]);
      expect(onSynced).toHaveBeenCalledTimes(1);
    });

    it("waits for each change before it sends the next", async () => {
      const order = [];
      let releaseFirst;
      const request = vi.fn((method, path) => {
        order.push(`start ${path}`);

        return path === "/tasks/1"
          ? new Promise((resolve) => {
              releaseFirst = () => {
                order.push("end /tasks/1");
                resolve({});
              };
            })
          : Promise.resolve({});
      });
      const { outbox } = createSubject({ request, entries: [FIRST, SECOND] });

      const flushing = outbox.flush();
      await vi.advanceTimersByTimeAsync(0);
      releaseFirst();
      await flushing;

      expect(order).toEqual([
        "start /tasks/1",
        "end /tasks/1",
        "start /tasks/2",
      ]);
    });

    it("treats a proxy error without a body like a lost connection", async () => {
      const request = vi.fn(() =>
        Promise.reject(apiError(500, "UNKNOWN_ERROR")),
      );
      const { outbox, onDropped } = createSubject({
        request,
        entries: [FIRST, SECOND],
      });

      await outbox.flush();

      expect(request).toHaveBeenCalledTimes(1);
      expect(outbox.getSnapshot()).toEqual({ pending: 2, offline: true });
      expect(onDropped).not.toHaveBeenCalled();
    });

    it("stops at a network failure, keeps the rest and says it is offline", async () => {
      const request = vi
        .fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(networkError());
      const { outbox, onSynced } = createSubject({
        request,
        entries: [FIRST, SECOND, entry("/tasks/3", "2026-11-05T09:02:00.000Z")],
      });

      await outbox.flush();

      expect(request).toHaveBeenCalledTimes(2);
      expect(outbox.getSnapshot()).toEqual({ pending: 2, offline: true });
      expect(readOutbox("u1").map((item) => item.path)).toEqual([
        "/tasks/2",
        "/tasks/3",
      ]);
      expect(onSynced).not.toHaveBeenCalled();
    });

    it.each([404, 409])(
      "counts a %s answer as already done",
      async (status) => {
        const request = vi
          .fn()
          .mockRejectedValueOnce(apiError(status))
          .mockResolvedValueOnce({});
        const { outbox, onDropped, onSynced } = createSubject({
          request,
          entries: [FIRST, SECOND],
        });

        await outbox.flush();

        expect(outbox.getSnapshot().pending).toBe(0);
        expect(onDropped).not.toHaveBeenCalled();
        expect(onSynced).toHaveBeenCalledTimes(1);
      },
    );

    it.each([400, 403, 422])(
      "drops a change the server refuses with %s, reports it and goes on",
      async (status) => {
        const error = apiError(status);
        const request = vi
          .fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValueOnce({});
        const { outbox, onDropped } = createSubject({
          request,
          entries: [FIRST, SECOND],
        });

        await outbox.flush();

        expect(onDropped).toHaveBeenCalledWith(error);
        expect(request).toHaveBeenCalledTimes(2);
        expect(outbox.getSnapshot().pending).toBe(0);
      },
    );

    it.each([401, 429, 500])(
      "keeps the queue and tries again later after %s",
      async (status) => {
        const request = vi.fn(() => Promise.reject(apiError(status)));
        const { outbox, onDropped } = createSubject({
          request,
          entries: [FIRST, SECOND],
        });

        await outbox.flush();

        expect(request).toHaveBeenCalledTimes(1);
        expect(outbox.getSnapshot()).toEqual({ pending: 2, offline: false });
        expect(onDropped).not.toHaveBeenCalled();
      },
    );

    it("gives one flush to callers that ask at the same time", async () => {
      const { client, outbox } = createSubject({ entries: [FIRST] });

      await Promise.all([outbox.flush(), outbox.flush()]);

      expect(client.request).toHaveBeenCalledTimes(1);
    });

    it("also sends a change that is added while it is flushing", async () => {
      let release;
      const request = vi.fn((method, path) =>
        path === "/tasks/1"
          ? new Promise((resolve) => {
              release = () => resolve({});
            })
          : Promise.resolve({}),
      );
      const { outbox, tick } = createSubject({ request, entries: [FIRST] });

      const flushing = outbox.flush();
      await vi.advanceTimersByTimeAsync(0);
      tick(2 * 3600 * 1000);
      await outbox.client.request("PATCH", "/tasks/new", { body: {} });
      release();
      await flushing;

      expect(request.mock.calls.map(([, path]) => path)).toEqual([
        "/tasks/1",
        "/tasks/new",
      ]);
      expect(outbox.getSnapshot().pending).toBe(0);
    });

    it("does nothing when there is nothing to send", async () => {
      const { client, outbox, onSynced } = createSubject();

      await outbox.flush();

      expect(client.request).not.toHaveBeenCalled();
      expect(onSynced).not.toHaveBeenCalled();
    });
  });

  describe("sending again by itself", () => {
    const WAITING = entry("/tasks/1", "2026-11-05T09:00:00.000Z");

    it("sends when the connection comes back", async () => {
      const { client, outbox } = createSubject({ entries: [WAITING] });
      outbox.activate();

      window.dispatchEvent(new Event("online"));
      await vi.advanceTimersByTimeAsync(0);

      expect(client.request).toHaveBeenCalledTimes(1);
      outbox.deactivate();
    });

    it("does not listen before it is activated or after it is deactivated", async () => {
      const { client, outbox } = createSubject({ entries: [WAITING] });

      window.dispatchEvent(new Event("online"));
      outbox.activate();
      outbox.deactivate();
      window.dispatchEvent(new Event("online"));
      await vi.advanceTimersByTimeAsync(0);

      expect(client.request).not.toHaveBeenCalled();
    });

    it("tries again on a timer while changes are waiting", async () => {
      const request = vi.fn(() => Promise.reject(networkError()));
      const { outbox } = createSubject({ request, entries: [WAITING] });
      outbox.activate();

      await vi.advanceTimersByTimeAsync(RETRY_INTERVAL_MS * 2);

      expect(request).toHaveBeenCalledTimes(2);
      outbox.deactivate();
    });

    it("stops the timer once everything has been sent", async () => {
      const { client, outbox } = createSubject({ entries: [WAITING] });
      outbox.activate();

      await vi.advanceTimersByTimeAsync(RETRY_INTERVAL_MS * 3);

      expect(client.request).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
      outbox.deactivate();
    });

    it("keeps no timer running while it is deactivated", () => {
      const { outbox } = createSubject({ entries: [WAITING] });

      outbox.activate();
      outbox.deactivate();

      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe("status", () => {
    it("starts with the changes that were saved earlier", () => {
      const { outbox } = createSubject({
        entries: [entry("/tasks/1", "2026-11-05T09:00:00.000Z")],
      });

      expect(outbox.getSnapshot()).toEqual({ pending: 1, offline: false });
    });

    it("tells listeners when something changes and stops after they leave", async () => {
      const { outbox } = createSubject({
        request: vi.fn(() => Promise.reject(networkError())),
      });
      const listener = vi.fn();
      const unsubscribe = outbox.subscribe(listener);

      await outbox.client.request("PATCH", "/tasks/1", { body: {} });
      const calls = listener.mock.calls.length;
      unsubscribe();
      await outbox.client.request("PATCH", "/tasks/2", { body: {} });

      expect(calls).toBeGreaterThan(0);
      expect(listener).toHaveBeenCalledTimes(calls);
    });

    it("keeps the same snapshot object while nothing changed", async () => {
      const { outbox } = createSubject();
      const before = outbox.getSnapshot();

      await outbox.client.request("PATCH", "/tasks/1", { body: {} });

      expect(outbox.getSnapshot()).toBe(before);
    });

    it("keeps each user's queue apart", () => {
      createSubject({
        userId: "u1",
        entries: [entry("/tasks/1", "2026-11-05T09:00:00.000Z")],
      });
      const { outbox } = createSubject({ userId: "u2" });

      expect(outbox.getSnapshot().pending).toBe(0);
    });
  });
});
