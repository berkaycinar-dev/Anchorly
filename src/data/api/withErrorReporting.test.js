import { describe, expect, it, vi } from "vitest";
import withErrorReporting from "./withErrorReporting";

function createRepository(overrides = {}) {
  return {
    getStatus: vi.fn(() => "ready"),
    getSnapshot: vi.fn(() => []),
    subscribe: vi.fn(() => () => {}),
    start: vi.fn(() => Promise.resolve()),
    create: vi.fn(() => Promise.resolve("created")),
    ...overrides,
  };
}

describe("withErrorReporting", () => {
  it("returns the original result of a mutation", async () => {
    const wrapped = withErrorReporting(createRepository(), vi.fn());

    await expect(wrapped.create("x")).resolves.toBe("created");
  });

  it("passes the arguments through", async () => {
    const repository = createRepository();
    const wrapped = withErrorReporting(repository, vi.fn());

    await wrapped.create("a", "b");

    expect(repository.create).toHaveBeenCalledWith("a", "b");
  });

  it("reports a rejected mutation and still rejects for the caller", async () => {
    const failure = new Error("offline");
    const onError = vi.fn();
    const wrapped = withErrorReporting(
      createRepository({ create: () => Promise.reject(failure) }),
      onError,
    );

    await expect(wrapped.create("x")).rejects.toBe(failure);

    expect(onError).toHaveBeenCalledWith(failure);
  });

  it("does not report a successful mutation", async () => {
    const onError = vi.fn();
    const wrapped = withErrorReporting(createRepository(), onError);

    await wrapped.create("x");

    expect(onError).not.toHaveBeenCalled();
  });

  it("leaves status, snapshot, subscribe and start untouched", () => {
    const repository = createRepository();
    const wrapped = withErrorReporting(repository, vi.fn());

    expect(wrapped.getStatus).toBe(repository.getStatus);
    expect(wrapped.getSnapshot).toBe(repository.getSnapshot);
    expect(wrapped.subscribe).toBe(repository.subscribe);
    expect(wrapped.start).toBe(repository.start);
  });

  it("works with a mutation that returns a plain value", () => {
    const wrapped = withErrorReporting(
      createRepository({ create: () => "plain" }),
      vi.fn(),
    );

    expect(wrapped.create()).toBe("plain");
  });
});
