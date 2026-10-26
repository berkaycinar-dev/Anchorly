import { act, renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { initialProjects } from "../constants/initialData";
import DataProvider from "../data/DataProvider";
import { isUuid } from "../lib/id";
import useProjects from "./useProjects";

const PROJECTS = [
  { id: "project-1", name: "Alpha" },
  { id: "project-2", name: "Beta" },
];

function renderProjects() {
  localStorage.setItem("projects", JSON.stringify(PROJECTS));

  return renderHook(() => useProjects(), { wrapper: DataProvider });
}

describe("useProjects", () => {
  it("starts with the demo projects on the first launch", () => {
    const { result } = renderHook(() => useProjects(), {
      wrapper: DataProvider,
    });

    expect(result.current.projects).toEqual(initialProjects);
  });

  it("adds a project with a UUID id to the end of the list", () => {
    const { result } = renderProjects();

    act(() => {
      result.current.addProject("Gamma");
    });

    const added = result.current.projects[2];

    expect(result.current.projects).toHaveLength(3);
    expect(result.current.projects.slice(0, 2)).toEqual(PROJECTS);
    expect(added).toEqual({ id: expect.any(String), name: "Gamma" });
    expect(isUuid(added.id)).toBe(true);
  });

  it("deletes only the given project", () => {
    const { result } = renderProjects();

    act(() => {
      result.current.deleteProject("project-1");
    });

    expect(result.current.projects).toEqual([PROJECTS[1]]);
  });

  it("saves the projects to localStorage after every change", () => {
    const { result } = renderProjects();

    act(() => {
      result.current.addProject("Gamma");
    });

    expect(JSON.parse(localStorage.getItem("projects"))).toEqual(
      result.current.projects,
    );

    act(() => {
      result.current.deleteProject("project-2");
    });

    expect(JSON.parse(localStorage.getItem("projects"))).toEqual(
      result.current.projects,
    );
    expect(result.current.projects).toHaveLength(2);
  });
});
