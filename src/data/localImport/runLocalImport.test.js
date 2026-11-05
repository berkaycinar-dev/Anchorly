import { describe, expect, it, vi } from "vitest";
import runLocalImport from "./runLocalImport";

function emptyPayload() {
  return { projects: [], routines: [], routineChecks: [], tasks: [] };
}

function result(imported, skipped = 0) {
  return {
    projects: { imported, skipped },
    routines: { imported, skipped },
    routineChecks: { imported, skipped },
    tasks: { imported, skipped },
  };
}

describe("runLocalImport", () => {
  it("posts the payload to /import and returns the answer", async () => {
    const client = { request: vi.fn().mockResolvedValue(result(2, 1)) };
    const payload = emptyPayload();

    const answer = await runLocalImport({ client, payload });

    expect(client.request).toHaveBeenCalledTimes(1);
    expect(client.request).toHaveBeenCalledWith(
      "POST",
      "/import",
      expect.objectContaining({ body: payload }),
    );
    expect(answer).toEqual(result(2, 1));
  });

  it("gives the import a long timeout", async () => {
    const client = { request: vi.fn().mockResolvedValue(result(0)) };

    await runLocalImport({ client, payload: emptyPayload() });

    expect(client.request.mock.calls[0][2].timeoutMs).toBeGreaterThan(60000);
  });

  it("adds up the answers of several requests", async () => {
    const client = {
      request: vi
        .fn()
        .mockResolvedValueOnce(result(0, 0))
        .mockResolvedValueOnce(result(1, 0))
        .mockResolvedValueOnce(result(2, 1))
        .mockResolvedValueOnce(result(3, 2)),
    };
    const big = {
      projects: [],
      routines: [],
      routineChecks: [],
      tasks: Array.from({ length: 3 }, (_, index) => ({
        id: `t${index}`,
        title: "x".repeat(4 * 1024 * 1024),
      })),
    };

    const answer = await runLocalImport({ client, payload: big });

    expect(client.request).toHaveBeenCalledTimes(4);
    expect(answer.tasks).toEqual({ imported: 6, skipped: 3 });
  });

  it("stops at the first failure", async () => {
    const failure = new Error("offline");
    const client = { request: vi.fn().mockRejectedValue(failure) };

    await expect(
      runLocalImport({ client, payload: emptyPayload() }),
    ).rejects.toBe(failure);
  });
});
