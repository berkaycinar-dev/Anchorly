import { describe, it, expect, vi } from "vitest";

const STORED_SETTINGS = {
  theme: "blue",
  language: "en",
  fontFamily: "Roboto",
  weekStartDay: "sunday",
};

export function runSettingsRepositoryContract(name, createRepository) {
  async function setUp(settings = STORED_SETTINGS) {
    const repository = await createRepository(settings);
    await repository.start();

    return repository;
  }

  describe(`${name} settings repository contract`, () => {
    it("is ready after it starts", async () => {
      const repository = await setUp();

      expect(repository.getStatus()).toBe("ready");
    });

    it("returns every setting in one object", async () => {
      const repository = await setUp();

      expect(repository.getSnapshot()).toEqual(STORED_SETTINGS);
    });

    it("returns the same settings object until something changes", async () => {
      const repository = await setUp();

      expect(repository.getSnapshot()).toBe(repository.getSnapshot());
    });

    it("changes only the settings in the patch", async () => {
      const repository = await setUp();

      const updated = await repository.update({ theme: "green" });

      expect(updated).toEqual({ ...STORED_SETTINGS, theme: "green" });
      expect(repository.getSnapshot()).toEqual(updated);
    });

    it("changes several settings at once", async () => {
      const repository = await setUp();

      await repository.update({ language: "tr", weekStartDay: "monday" });

      expect(repository.getSnapshot()).toEqual({
        ...STORED_SETTINGS,
        language: "tr",
        weekStartDay: "monday",
      });
    });

    it("returns a new settings object after a change", async () => {
      const repository = await setUp();
      const before = repository.getSnapshot();

      await repository.update({ theme: "green" });

      expect(repository.getSnapshot()).not.toBe(before);
    });

    it("rejects an unknown setting and changes nothing", async () => {
      const repository = await setUp();

      await expect(repository.update({ colour: "red" })).rejects.toThrow(
        'Unknown setting "colour"',
      );
      expect(repository.getSnapshot()).toEqual(STORED_SETTINGS);
    });

    it("shows a change in the snapshot before the returned promise settles", async () => {
      const repository = await setUp();

      const pending = repository.update({ theme: "green" });

      expect(repository.getSnapshot().theme).toBe("green");
      await pending;
    });

    it("notifies subscribers after a change", async () => {
      const repository = await setUp();
      const listener = vi.fn();
      repository.subscribe(listener);

      await repository.update({ fontFamily: "Inter" });

      expect(listener).toHaveBeenCalled();
    });

    it("stops notifying a subscriber after it unsubscribes", async () => {
      const repository = await setUp();
      const listener = vi.fn();
      const unsubscribe = repository.subscribe(listener);

      unsubscribe();
      await repository.update({ fontFamily: "Inter" });

      expect(listener).not.toHaveBeenCalled();
    });
  });
}
