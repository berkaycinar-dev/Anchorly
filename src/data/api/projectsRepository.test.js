import { describe, it, expect } from "vitest";
import createFakeApiClient from "../../test/fakeApiClient";
import { runProjectsRepositoryContract } from "../contracts/projectsRepository.contract";
import { ApiError } from "./ApiError";
import createApiProjectsRepository from "./projectsRepository";

const FIRST = { id: "678e4529-fa35-432c-8baa-6a1298ba43f1", name: "First" };
const SECOND = { id: "f9eeef00-3cc4-4b6f-9f33-29dc56ba3508", name: "Second" };
const NEW_PROJECT = { id: "0b7c5d5e-2f4a-4f9e-9a51-6e4f3c2b1a00", name: "New" };

function createSubject(projects = [FIRST, SECOND]) {
  const client = createFakeApiClient({ projects });
  const repository = createApiProjectsRepository({ client });

  return { client, repository };
}

function describeCalls(client) {
  return client.calls.map((call) => `${call.method} ${call.path}`);
}

runProjectsRepositoryContract(
  "api",
  (projects) => createSubject(projects).repository,
);

describe("api projects repository", () => {
  it("starts loading with an empty list", () => {
    const { repository } = createSubject();

    expect(repository.getStatus()).toBe("loading");
    expect(repository.getSnapshot()).toEqual([]);
  });

  it("loads the projects from the server when it starts", async () => {
    const { client, repository } = createSubject();

    await repository.start();

    expect(repository.getSnapshot()).toEqual([FIRST, SECOND]);
    expect(describeCalls(client)).toEqual(["GET /projects"]);
  });

  it("sends only the id and name when it creates a project", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.create({ ...NEW_PROJECT, archived: false });

    expect(client.calls.at(-1)).toEqual({
      method: "POST",
      path: "/projects",
      body: NEW_PROJECT,
    });
  });

  it("uses the name the server returns for a created project", async () => {
    const { repository } = createSubject();
    await repository.start();

    const created = await repository.create({
      ...NEW_PROJECT,
      name: "  Spaced  ",
    });

    expect(created).toEqual({ ...NEW_PROJECT, name: "Spaced" });
    expect(repository.getSnapshot().at(-1).name).toBe("Spaced");
  });

  it("sends only the name when it updates a project", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.update(FIRST.id, { name: "Renamed", archived: true });

    expect(client.calls.at(-1)).toEqual({
      method: "PATCH",
      path: `/projects/${FIRST.id}`,
      body: { name: "Renamed" },
    });
  });

  it("sends nothing for a change the server does not store", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.update(FIRST.id, { archived: true });

    expect(describeCalls(client)).toEqual(["GET /projects"]);
  });

  it("sends a delete request when it removes a project", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.remove(FIRST.id);

    expect(client.calls.at(-1)).toEqual({
      method: "DELETE",
      path: `/projects/${FIRST.id}`,
      body: undefined,
    });
    expect(client.getStoredProjects()).toEqual([SECOND]);
  });

  it("sends nothing for a project that does not exist", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.update(NEW_PROJECT.id, { name: "Missing" });
    await repository.remove(NEW_PROJECT.id);

    expect(describeCalls(client)).toEqual(["GET /projects"]);
  });

  it("rolls back a rejected create", async () => {
    const { client, repository } = createSubject();
    await repository.start();
    client.failNext();

    await expect(repository.create(NEW_PROJECT)).rejects.toBeInstanceOf(
      ApiError,
    );

    expect(repository.getSnapshot()).toEqual([FIRST, SECOND]);
  });

  it("brings a project back in its place when its removal is rejected", async () => {
    const { client, repository } = createSubject();
    await repository.start();
    client.failNext();

    await expect(repository.remove(FIRST.id)).rejects.toBeInstanceOf(ApiError);

    expect(repository.getSnapshot()).toEqual([FIRST, SECOND]);
  });
});
