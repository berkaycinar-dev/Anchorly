import { describe, it, expect, vi } from "vitest";

const FIRST = { id: "678e4529-fa35-432c-8baa-6a1298ba43f1", name: "First" };
const SECOND = { id: "f9eeef00-3cc4-4b6f-9f33-29dc56ba3508", name: "Second" };
const NEW_PROJECT = { id: "0b7c5d5e-2f4a-4f9e-9a51-6e4f3c2b1a00", name: "New" };

export function runProjectsRepositoryContract(name, createRepository) {
  async function setUp(projects = [FIRST, SECOND]) {
    const repository = await createRepository(projects);
    await repository.start();

    return repository;
  }

  describe(`${name} projects repository contract`, () => {
    it("is ready after it starts", async () => {
      const repository = await setUp();

      expect(repository.getStatus()).toBe("ready");
    });

    it("lists the existing projects in order", async () => {
      const repository = await setUp();

      expect(repository.getSnapshot()).toEqual([FIRST, SECOND]);
    });

    it("returns the same list object until something changes", async () => {
      const repository = await setUp();

      expect(repository.getSnapshot()).toBe(repository.getSnapshot());
    });

    it("adds a created project to the end of the list", async () => {
      const repository = await setUp();

      const created = await repository.create(NEW_PROJECT);

      expect(created).toEqual(NEW_PROJECT);
      expect(repository.getSnapshot()).toEqual([FIRST, SECOND, NEW_PROJECT]);
    });

    it("removes only the given project", async () => {
      const repository = await setUp();

      await repository.remove(FIRST.id);

      expect(repository.getSnapshot()).toEqual([SECOND]);
    });

    it("keeps the list unchanged when the removed project does not exist", async () => {
      const repository = await setUp();

      await repository.remove(NEW_PROJECT.id);

      expect(repository.getSnapshot()).toEqual([FIRST, SECOND]);
    });

    it("shows a change in the snapshot before the returned promise settles", async () => {
      const repository = await setUp();

      const pending = repository.create(NEW_PROJECT);

      expect(repository.getSnapshot()).toContainEqual(NEW_PROJECT);
      await pending;
    });

    it("notifies subscribers after a change", async () => {
      const repository = await setUp();
      const listener = vi.fn();
      repository.subscribe(listener);

      await repository.create(NEW_PROJECT);

      expect(listener).toHaveBeenCalled();
    });

    it("stops notifying a subscriber after it unsubscribes", async () => {
      const repository = await setUp();
      const listener = vi.fn();
      const unsubscribe = repository.subscribe(listener);

      unsubscribe();
      await repository.create(NEW_PROJECT);

      expect(listener).not.toHaveBeenCalled();
    });
  });
}