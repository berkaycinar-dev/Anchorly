import { describe, it, expect, vi } from "vitest";
import { initialRoutines } from "../../constants/initialData";
import { runRoutinesRepositoryContract } from "../contracts/routinesRepository.contract";
import { getSnapshot as getStorageIssues } from "./storageStatus";
import createLocalRoutinesRepository from "./routinesRepository";

const ROUTINE_ID = "42a8fe5c-29ef-47b1-a3f3-1af09f7b5a20";

function createSeededRepository({ routines, checks }) {
  localStorage.setItem("routines", JSON.stringify(routines));
  localStorage.setItem("routineChecks", JSON.stringify(checks));

  return createLocalRoutinesRepository();
}

runRoutinesRepositoryContract("local", createSeededRepository);

describe("local routines repository", () => {
  it("starts with the demo routines and no checks on the first launch", () => {
    const repository = createLocalRoutinesRepository();

    expect(repository.getSnapshot()).toEqual({
      routines: initialRoutines,
      checks: {},
    });
  });

  it("writes the routines and the checks under their own keys when it starts", async () => {
    const repository = createLocalRoutinesRepository();

    await repository.start();

    expect(JSON.parse(localStorage.getItem("routines"))).toEqual(
      initialRoutines,
    );
    expect(localStorage.getItem("routineChecks")).toBe("{}");
  });

  it("saves the check under the same key format as before", async () => {
    const repository = createSeededRepository({
      routines: [{ id: ROUTINE_ID, title: "Water" }],
      checks: {},
    });

    await repository.setCheck(ROUTINE_ID, "2026-10-10", true);

    expect(JSON.parse(localStorage.getItem("routineChecks"))).toEqual({
      [`2026-10-${ROUTINE_ID}-10`]: true,
    });
  });

  it("keeps an unchecked day in storage as false", async () => {
    const repository = createSeededRepository({
      routines: [{ id: ROUTINE_ID, title: "Water" }],
      checks: { [`2026-10-${ROUTINE_ID}-10`]: true },
    });

    await repository.setCheck(ROUTINE_ID, "2026-10-10", false);

    expect(JSON.parse(localStorage.getItem("routineChecks"))).toEqual({
      [`2026-10-${ROUTINE_ID}-10`]: false,
    });
  });

  it("does not change the routines when only a check changes", async () => {
    const repository = createSeededRepository({
      routines: [{ id: ROUTINE_ID, title: "Water" }],
      checks: {},
    });
    const routinesBefore = repository.getSnapshot().routines;

    await repository.setCheck(ROUTINE_ID, "2026-10-10", true);

    expect(repository.getSnapshot().routines).toBe(routinesBefore);
  });

  it("keeps the routines and reports only the checks when the checks are corrupt", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(
      "routines",
      JSON.stringify([{ id: ROUTINE_ID, title: "Water" }]),
    );
    localStorage.setItem("routineChecks", "{broken");
    const repository = createLocalRoutinesRepository();

    await repository.start();

    expect(repository.getSnapshot()).toEqual({
      routines: [{ id: ROUTINE_ID, title: "Water" }],
      checks: {},
    });
    expect(getStorageIssues()).toEqual([
      { key: "routineChecks", kind: "read" },
    ]);
  });
});