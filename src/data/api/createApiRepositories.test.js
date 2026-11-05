import { describe, expect, it } from "vitest";
import createFakeApiClient from "../../test/fakeApiClient";
import createApiRepositories from "./createApiRepositories";

describe("createApiRepositories", () => {
  it("creates the four repositories the app uses", () => {
    const repositories = createApiRepositories({
      client: createFakeApiClient(),
      today: "2026-11-05",
    });

    expect(Object.keys(repositories).sort()).toEqual([
      "projects",
      "routines",
      "settings",
      "tasks",
    ]);
  });

  it("creates repositories that load from the given client", async () => {
    const client = createFakeApiClient();
    const repositories = createApiRepositories({ client, today: "2026-11-05" });

    await repositories.settings.start();

    expect(repositories.settings.getStatus()).toBe("ready");
    expect(client.calls.length).toBeGreaterThan(0);
  });
});
