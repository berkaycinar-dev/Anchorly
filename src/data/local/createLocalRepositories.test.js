import { describe, it, expect } from "vitest";
import { createInitialTasks } from "../../constants/initialData";
import createLocalRepositories from "./createLocalRepositories";

describe("createLocalRepositories", () => {
  it("creates the tasks, routines, projects and settings repositories", () => {
    const repositories = createLocalRepositories({ today: "2026-10-10" });

    expect(Object.keys(repositories).sort()).toEqual([
      "projects",
      "routines",
      "settings",
      "tasks",
    ]);
    Object.values(repositories).forEach((repository) => {
      expect(repository.getStatus()).toBe("ready");
    });
  });

  it("passes today's date to the tasks repository", () => {
    const repositories = createLocalRepositories({ today: "2026-10-10" });

    expect(repositories.tasks.getSnapshot()).toEqual(
      createInitialTasks("2026-10-10"),
    );
  });

  it("does not write anything to storage while it creates the repositories", () => {
    createLocalRepositories({ today: "2026-10-10" });

    expect(localStorage.length).toBe(0);
  });
});
