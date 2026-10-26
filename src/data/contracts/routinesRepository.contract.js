import { describe, it, expect, vi } from "vitest";

const FIRST_ID = "42a8fe5c-29ef-47b1-a3f3-1af09f7b5a20";
const SECOND_ID = "cfd63e9e-901f-44fd-8ab6-2ef4bd8133d8";
const NEW_ID = "9d2f6a41-5c0e-4b7a-8e13-6f7a2b9c4d10";

const FIRST = { id: FIRST_ID, title: "Water" };
const SECOND = { id: SECOND_ID, title: "Read" };
const NEW_ROUTINE = { id: NEW_ID, title: "Walk" };

const CHECKS = {
  [`2026-10-${FIRST_ID}-9`]: true,
  [`2026-10-${FIRST_ID}-10`]: true,
  [`2026-10-${SECOND_ID}-10`]: true,
};

export function runRoutinesRepositoryContract(name, createRepository) {
  async function setUp(routines = [FIRST, SECOND], checks = CHECKS) {
    const repository = await createRepository({ routines, checks });
    await repository.start();

    return repository;
  }

  function isChecked(repository, routineId, monthKey, day) {
    return Boolean(
      repository.getSnapshot().checks[`${monthKey}-${routineId}-${day}`],
    );
  }

  describe(`${name} routines repository contract`, () => {
    it("is ready after it starts", async () => {
      const repository = await setUp();

      expect(repository.getStatus()).toBe("ready");
    });

    it("returns the routines in order and the checks by day key", async () => {
      const repository = await setUp();

      expect(repository.getSnapshot()).toEqual({
        routines: [FIRST, SECOND],
        checks: CHECKS,
      });
    });

    it("returns the same snapshot object until something changes", async () => {
      const repository = await setUp();

      expect(repository.getSnapshot()).toBe(repository.getSnapshot());
    });

    it("adds a created routine to the end of the list", async () => {
      const repository = await setUp();

      const created = await repository.create(NEW_ROUTINE);

      expect(created).toEqual(NEW_ROUTINE);
      expect(repository.getSnapshot().routines).toEqual([
        FIRST,
        SECOND,
        NEW_ROUTINE,
      ]);
    });

    it("removes the routine together with all of its checks", async () => {
      const repository = await setUp();

      await repository.remove(FIRST_ID);

      expect(repository.getSnapshot()).toEqual({
        routines: [SECOND],
        checks: { [`2026-10-${SECOND_ID}-10`]: true },
      });
    });

    it("keeps everything unchanged when the removed routine does not exist", async () => {
      const repository = await setUp();

      await repository.remove(NEW_ID);

      expect(repository.getSnapshot()).toEqual({
        routines: [FIRST, SECOND],
        checks: CHECKS,
      });
    });

    it("marks a day as checked by routine id and local date", async () => {
      const repository = await setUp();

      await repository.setCheck(SECOND_ID, "2026-10-09", true);

      expect(isChecked(repository, SECOND_ID, "2026-10", 9)).toBe(true);
    });

    it("marks a checked day as unchecked", async () => {
      const repository = await setUp();

      await repository.setCheck(FIRST_ID, "2026-10-10", false);

      expect(isChecked(repository, FIRST_ID, "2026-10", 10)).toBe(false);
    });

    it("keeps the other checks when one day changes", async () => {
      const repository = await setUp();

      await repository.setCheck(FIRST_ID, "2026-10-10", false);

      expect(isChecked(repository, FIRST_ID, "2026-10", 9)).toBe(true);
      expect(isChecked(repository, SECOND_ID, "2026-10", 10)).toBe(true);
    });

    it("uses the month and day without leading zeros in the day key", async () => {
      const repository = await setUp([FIRST], {});

      await repository.setCheck(FIRST_ID, "2027-01-05", true);

      expect(repository.getSnapshot().checks).toEqual({
        [`2027-1-${FIRST_ID}-5`]: true,
      });
    });

    it("shows a change in the snapshot before the returned promise settles", async () => {
      const repository = await setUp();

      const pending = repository.setCheck(SECOND_ID, "2026-10-09", true);

      expect(isChecked(repository, SECOND_ID, "2026-10", 9)).toBe(true);
      await pending;
    });

    it("notifies subscribers after a change", async () => {
      const repository = await setUp();
      const listener = vi.fn();
      repository.subscribe(listener);

      await repository.setCheck(SECOND_ID, "2026-10-09", true);

      expect(listener).toHaveBeenCalled();
    });

    it("stops notifying a subscriber after it unsubscribes", async () => {
      const repository = await setUp();
      const listener = vi.fn();
      const unsubscribe = repository.subscribe(listener);

      unsubscribe();
      await repository.create(NEW_ROUTINE);

      expect(listener).not.toHaveBeenCalled();
    });
  });
}
