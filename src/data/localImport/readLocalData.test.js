import { describe, expect, it } from "vitest";
import readLocalData from "./readLocalData";

describe("readLocalData", () => {
  it("reads the stored tasks, projects, routines and checks", () => {
    localStorage.setItem(
      "tasks",
      JSON.stringify([
        { id: "aaaaaaaa-0000-4000-8000-000000000001", title: "Stored" },
      ]),
    );
    localStorage.setItem(
      "projects",
      JSON.stringify([{ id: "p1", name: "Stored project" }]),
    );
    localStorage.setItem(
      "routines",
      JSON.stringify([{ id: "r1", title: "Stored routine" }]),
    );
    localStorage.setItem("routineChecks", JSON.stringify({ key: true }));

    const data = readLocalData("2026-11-05");

    expect(data.tasks.map((task) => task.title)).toEqual(["Stored"]);
    expect(data.projects).toEqual([{ id: "p1", name: "Stored project" }]);
    expect(data.routines).toEqual([{ id: "r1", title: "Stored routine" }]);
    expect(data.checks).toEqual({ key: true });
  });

  it("returns the demo data when nothing is stored", () => {
    const data = readLocalData("2026-11-05");

    expect(data.tasks.length).toBeGreaterThan(0);
    expect(data.checks).toEqual({});
  });

  it("does not write anything to storage", () => {
    readLocalData("2026-11-05");

    expect(localStorage.length).toBe(0);
  });
});
