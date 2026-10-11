import { describe, it, expect } from "vitest";
import { initialProjects, initialRoutines, initialTasks } from "./initialData";
import { isUuid } from "../lib/id";

describe("initialData", () => {
  it("uses uuids for every seed id", () => {
    const ids = [...initialTasks, ...initialRoutines, ...initialProjects].map(
      (record) => record.id,
    );

    ids.forEach((id) => {
      expect(isUuid(id)).toBe(true);
    });
  });

  it("uses a different id for every seed record", () => {
    const ids = [...initialTasks, ...initialRoutines, ...initialProjects].map(
      (record) => record.id,
    );

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("refers only to seed projects that exist", () => {
    const projectIds = initialProjects.map((project) => project.id);

    initialTasks.forEach((task) => {
      expect(
        task.projectId === null || projectIds.includes(task.projectId),
      ).toBe(true);
    });
  });
});
