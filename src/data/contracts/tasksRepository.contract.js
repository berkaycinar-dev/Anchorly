import { describe, it, expect, vi } from "vitest";

function createTask(id, overrides = {}) {
  return {
    id,
    title: `Task ${id.slice(0, 4)}`,
    category: "Work",
    date: "2026-10-10",
    completed: false,
    projectId: null,
    description: "",
    steps: [],
    completedAt: null,
    order: 0,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
    ...overrides,
  };
}

const FIRST = createTask("11111111-1111-4111-8111-111111111111", { order: 0 });
const SECOND = createTask("22222222-2222-4222-8222-222222222222", {
  order: 1,
});
const THIRD = createTask("33333333-3333-4333-8333-333333333333", { order: 2 });
const NEW_TASK = createTask("44444444-4444-4444-8444-444444444444", {
  order: 99,
});
const OTHER_NEW_TASK = createTask("55555555-5555-4555-8555-555555555555", {
  order: 100,
});

export function runTasksRepositoryContract(name, createRepository) {
  async function setUp(tasks = [FIRST, SECOND, THIRD]) {
    const repository = await createRepository(tasks);
    await repository.start();

    return repository;
  }

  function getIds(repository) {
    return repository.getSnapshot().map((task) => task.id);
  }

  function findTask(repository, id) {
    return repository.getSnapshot().find((task) => task.id === id);
  }

  describe(`${name} tasks repository contract`, () => {
    it("is ready after it starts", async () => {
      const repository = await setUp();

      expect(repository.getStatus()).toBe("ready");
    });

    it("lists the tasks in their stored order", async () => {
      const repository = await setUp([THIRD, FIRST, SECOND]);

      expect(repository.getSnapshot()).toEqual([THIRD, FIRST, SECOND]);
    });

    it("returns the same list object until something changes", async () => {
      const repository = await setUp();

      expect(repository.getSnapshot()).toBe(repository.getSnapshot());
    });

    it("adds a created task to the start of the list", async () => {
      const repository = await setUp();

      const created = await repository.create(NEW_TASK);

      expect(created).toEqual(NEW_TASK);
      expect(getIds(repository)).toEqual([
        NEW_TASK.id,
        FIRST.id,
        SECOND.id,
        THIRD.id,
      ]);
    });

    it("adds several created tasks to the end of the list in the given order", async () => {
      const repository = await setUp();

      const created = await repository.createMany([NEW_TASK, OTHER_NEW_TASK]);

      expect(created).toEqual([NEW_TASK, OTHER_NEW_TASK]);
      expect(getIds(repository)).toEqual([
        FIRST.id,
        SECOND.id,
        THIRD.id,
        NEW_TASK.id,
        OTHER_NEW_TASK.id,
      ]);
    });

    it("merges a patch into one task and keeps its other fields", async () => {
      const repository = await setUp();

      const updated = await repository.update(SECOND.id, {
        title: "Renamed",
        completed: true,
      });

      expect(updated).toEqual({ ...SECOND, title: "Renamed", completed: true });
      expect(findTask(repository, SECOND.id)).toEqual(updated);
    });

    it("keeps the other tasks and the list order when one task changes", async () => {
      const repository = await setUp();

      await repository.update(SECOND.id, { title: "Renamed" });

      expect(getIds(repository)).toEqual([FIRST.id, SECOND.id, THIRD.id]);
      expect(findTask(repository, FIRST.id)).toEqual(FIRST);
      expect(findTask(repository, THIRD.id)).toEqual(THIRD);
    });

    it("keeps the list unchanged when the updated task does not exist", async () => {
      const repository = await setUp();

      await repository.update(NEW_TASK.id, { title: "Ghost" });

      expect(repository.getSnapshot()).toEqual([FIRST, SECOND, THIRD]);
    });

    it("applies several patches at once", async () => {
      const repository = await setUp();

      await repository.updateMany([
        { id: FIRST.id, patch: { projectId: null, title: "One" } },
        { id: THIRD.id, patch: { title: "Three" } },
      ]);

      expect(findTask(repository, FIRST.id).title).toBe("One");
      expect(findTask(repository, SECOND.id)).toEqual(SECOND);
      expect(findTask(repository, THIRD.id).title).toBe("Three");
    });

    it("removes only the given task", async () => {
      const repository = await setUp();

      await repository.remove(SECOND.id);

      expect(getIds(repository)).toEqual([FIRST.id, THIRD.id]);
    });

    it("removes several tasks at once", async () => {
      const repository = await setUp();

      await repository.removeMany([FIRST.id, THIRD.id]);

      expect(getIds(repository)).toEqual([SECOND.id]);
    });

    it("sets the order of the listed tasks to their position in the list", async () => {
      const repository = await setUp();

      await repository.reorder([THIRD.id, FIRST.id]);

      expect(findTask(repository, THIRD.id).order).toBe(0);
      expect(findTask(repository, FIRST.id).order).toBe(1);
    });

    it("keeps the order of tasks that are not in the reorder list", async () => {
      const repository = await setUp();

      await repository.reorder([THIRD.id, FIRST.id]);

      expect(findTask(repository, SECOND.id).order).toBe(SECOND.order);
    });

    it("does not move tasks inside the list when it reorders", async () => {
      const repository = await setUp();

      await repository.reorder([THIRD.id, SECOND.id, FIRST.id]);

      expect(getIds(repository)).toEqual([FIRST.id, SECOND.id, THIRD.id]);
    });

    it("shows a change in the snapshot before the returned promise settles", async () => {
      const repository = await setUp();

      const pending = repository.update(FIRST.id, { completed: true });

      expect(findTask(repository, FIRST.id).completed).toBe(true);
      await pending;
    });

    it("notifies subscribers after a change", async () => {
      const repository = await setUp();
      const listener = vi.fn();
      repository.subscribe(listener);

      await repository.remove(FIRST.id);

      expect(listener).toHaveBeenCalled();
    });

    it("stops notifying a subscriber after it unsubscribes", async () => {
      const repository = await setUp();
      const listener = vi.fn();
      const unsubscribe = repository.subscribe(listener);

      unsubscribe();
      await repository.create(NEW_TASK);

      expect(listener).not.toHaveBeenCalled();
    });
  });
}