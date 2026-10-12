import { describe, it, expect } from "vitest";
import {
  createInitialTasks,
  initialProjects,
  initialRoutines,
} from "./initialData";
import { isUuid } from "../lib/id";
import { isTaskVisibleToday } from "../utils/taskHelpers";

const TODAY = "2026-10-11";

function getSeedIds(today) {
  return [
    ...createInitialTasks(today),
    ...initialRoutines,
    ...initialProjects,
  ].map((record) => record.id);
}

describe("initialData", () => {
  it("uses uuids for every seed id", () => {
    getSeedIds(TODAY).forEach((id) => {
      expect(isUuid(id)).toBe(true);
    });
  });

  it("uses a different id for every seed record", () => {
    const ids = getSeedIds(TODAY);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("refers only to seed projects that exist", () => {
    const projectIds = initialProjects.map((project) => project.id);

    createInitialTasks(TODAY).forEach((task) => {
      expect(
        task.projectId === null || projectIds.includes(task.projectId),
      ).toBe(true);
    });
  });

  it("keeps the same ids whatever the date is", () => {
    expect(getSeedIds("2026-10-11")).toEqual(getSeedIds("2027-03-01"));
  });

  it("puts four tasks on today and one on tomorrow", () => {
    const dates = createInitialTasks(TODAY).map((task) => task.date);

    expect(dates).toEqual([
      "2026-10-11",
      "2026-10-11",
      "2026-10-11",
      "2026-10-11",
      "2026-10-12",
    ]);
  });

  it("rolls tomorrow over month and year boundaries", () => {
    const tasks = createInitialTasks("2026-12-31");

    expect(tasks[0].date).toBe("2026-12-31");
    expect(tasks[4].date).toBe("2027-01-01");
  });

  it("marks the completed seed task as completed today", () => {
    const completedTasks = createInitialTasks(TODAY).filter(
      (task) => task.completed,
    );

    expect(completedTasks).toHaveLength(1);
    expect(completedTasks[0].completedAt).toBe(TODAY);
  });

  it("shows four seed tasks on the today page and hides tomorrow's task", () => {
    const visibleTitles = createInitialTasks(TODAY)
      .filter((task) => isTaskVisibleToday(task, TODAY))
      .map((task) => task.title);

    expect(visibleTitles).toEqual([
      "Finish React Project",
      "Buy groceries",
      "Read 30 pages of a book",
      "Go to the gym",
    ]);
  });
});