import { act, renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import useRoutines from "./useRoutines";

const FIRST_ID = "42a8fe5c-29ef-47b1-a3f3-1af09f7b5a20";
const SECOND_ID = "cfd63e9e-901f-44fd-8ab6-2ef4bd8133d8";

function renderRoutines() {
  localStorage.setItem(
    "routines",
    JSON.stringify([
      { id: FIRST_ID, title: "Routine 1" },
      { id: SECOND_ID, title: "Routine 2" },
    ]),
  );
  localStorage.setItem(
    "routineChecks",
    JSON.stringify({
      [`2026-10-${FIRST_ID}-1`]: true,
      [`2026-10-${FIRST_ID}-2`]: true,
      [`2026-10-${SECOND_ID}-1`]: true,
    }),
  );

  return renderHook(() => useRoutines("2026-10-10"));
}

describe("useRoutines deleteRoutine", () => {
  it("removes the routine from the list", () => {
    const { result } = renderRoutines();

    act(() => {
      result.current.deleteRoutine(FIRST_ID);
    });

    expect(result.current.routines.map((routine) => routine.id)).toEqual([
      SECOND_ID,
    ]);
  });

  it("removes only the checks of the deleted routine", () => {
    const { result } = renderRoutines();

    act(() => {
      result.current.deleteRoutine(FIRST_ID);
    });

    expect(Object.keys(result.current.routineChecks)).toEqual([
      `2026-10-${SECOND_ID}-1`,
    ]);
  });
});
