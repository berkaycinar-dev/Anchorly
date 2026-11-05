import { describe, it, expect } from "vitest";
import createFakeApiClient, { checkKeysToRows } from "../../test/fakeApiClient";
import { runRoutinesRepositoryContract } from "../contracts/routinesRepository.contract";
import { ApiError } from "./ApiError";
import createApiRoutinesRepository from "./routinesRepository";

const FIRST = { id: "42a8fe5c-29ef-47b1-a3f3-1af09f7b5a20", title: "Water" };
const SECOND = { id: "cfd63e9e-901f-44fd-8ab6-2ef4bd8133d8", title: "Read" };
const NEW_ROUTINE = {
  id: "9d2f6a41-5c0e-4b7a-8e13-6f7a2b9c4d10",
  title: "Walk",
};

function createSubject({ routines = [FIRST, SECOND], checks = {} } = {}) {
  const client = createFakeApiClient({
    routines,
    checkRows: checkKeysToRows(checks),
  });
  const repository = createApiRoutinesRepository({ client });

  return { client, repository };
}

function describeCalls(client) {
  return client.calls.map((call) => `${call.method} ${call.path}`);
}

runRoutinesRepositoryContract(
  "api",
  ({ routines, checks }) => createSubject({ routines, checks }).repository,
);

describe("api routines repository", () => {
  it("starts loading with no routines and no checks", () => {
    const { repository } = createSubject();

    expect(repository.getStatus()).toBe("loading");
    expect(repository.getSnapshot()).toEqual({ routines: [], checks: {} });
  });

  it("asks the server for the routines and their checks when it starts", async () => {
    const { client, repository } = createSubject();

    await repository.start();

    expect(describeCalls(client).sort()).toEqual([
      "GET /routines",
      "GET /routines/checks",
    ]);
  });

  it("turns the check rows into day keys and keeps unchecked days", async () => {
    const { repository } = createSubject({
      checks: {
        [`2026-10-${FIRST.id}-9`]: true,
        [`2026-10-${FIRST.id}-10`]: false,
      },
    });

    await repository.start();

    expect(repository.getSnapshot().checks).toEqual({
      [`2026-10-${FIRST.id}-9`]: true,
      [`2026-10-${FIRST.id}-10`]: false,
    });
  });

  it("sends only the id and title when it creates a routine", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.create({ ...NEW_ROUTINE, color: "red" });

    expect(client.calls.at(-1)).toEqual({
      method: "POST",
      path: "/routines",
      body: NEW_ROUTINE,
    });
  });

  it("sends a delete request when it removes a routine", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.remove(FIRST.id);

    expect(client.calls.at(-1)).toEqual({
      method: "DELETE",
      path: `/routines/${FIRST.id}`,
      body: undefined,
    });
    expect(client.getStoredRoutines()).toEqual([SECOND]);
  });

  it("sends nothing for a routine that does not exist", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.remove(NEW_ROUTINE.id);

    expect(describeCalls(client).sort()).toEqual([
      "GET /routines",
      "GET /routines/checks",
    ]);
  });

  it("sends the routine id, the date and the state when it sets a check", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.setCheck(FIRST.id, "2027-01-05", true);

    expect(client.calls.at(-1)).toEqual({
      method: "PUT",
      path: `/routines/${FIRST.id}/checks/2027-01-05`,
      body: { checked: true },
    });
    expect(client.getStoredCheckRows()).toEqual([
      { routineId: FIRST.id, date: "2027-01-05", checked: true },
    ]);
  });

  it("rolls back a rejected check", async () => {
    const { client, repository } = createSubject();
    await repository.start();
    client.failNext();

    await expect(
      repository.setCheck(FIRST.id, "2026-10-09", true),
    ).rejects.toBeInstanceOf(ApiError);

    expect(repository.getSnapshot().checks).toEqual({});
  });

  it("brings a routine and its checks back when its removal is rejected", async () => {
    const checks = { [`2026-10-${FIRST.id}-9`]: true };
    const { client, repository } = createSubject({ checks });
    await repository.start();
    client.failNext();

    await expect(repository.remove(FIRST.id)).rejects.toBeInstanceOf(ApiError);

    expect(repository.getSnapshot()).toEqual({
      routines: [FIRST, SECOND],
      checks,
    });
  });

  it("loads a check for a month and day without leading zeros", async () => {
    const { repository } = createSubject({
      checks: { [`2027-1-${FIRST.id}-5`]: true },
    });

    await repository.start();

    expect(repository.getSnapshot().checks).toEqual({
      [`2027-1-${FIRST.id}-5`]: true,
    });
  });
});
