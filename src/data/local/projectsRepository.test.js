import { describe, it, expect, vi } from "vitest";
import { initialProjects } from "../../constants/initialData";
import { runProjectsRepositoryContract } from "../contracts/projectsRepository.contract";
import { getSnapshot as getStorageIssues } from "./storageStatus";
import createLocalProjectsRepository from "./projectsRepository";

function createSeededRepository(projects) {
  localStorage.setItem("projects", JSON.stringify(projects));
  return createLocalProjectsRepository();
}

runProjectsRepositoryContract("local", createSeededRepository);

describe("local projects repository", () => {
  it("starts with the demo projects on the first launch", () => {
    const repository = createLocalProjectsRepository();

    expect(repository.getSnapshot()).toEqual(initialProjects);
  });

  it("writes the demo projects to storage when it starts", async () => {
    const repository = createLocalProjectsRepository();

    await repository.start();

    expect(JSON.parse(localStorage.getItem("projects"))).toEqual(
      initialProjects,
    );
  });

  it("saves the projects under the same key and format after a change", async () => {
    const repository = createSeededRepository([]);
    const project = { id: "0b7c5d5e-2f4a-4f9e-9a51-6e4f3c2b1a00", name: "New" };

    await repository.create(project);

    expect(localStorage.getItem("projects")).toBe(JSON.stringify([project]));
  });

  it("falls back to the demo projects and reports a read issue for corrupt data", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem("projects", "{broken");
    const repository = createLocalProjectsRepository();

    await repository.start();

    expect(repository.getSnapshot()).toEqual(initialProjects);
    expect(getStorageIssues()).toEqual([{ key: "projects", kind: "read" }]);
  });
});