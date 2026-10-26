import { describe, it, expect, vi } from "vitest";
import { createInitialTasks } from "../../constants/initialData";
import { runTasksRepositoryContract } from "../contracts/tasksRepository.contract";
import { getSnapshot as getStorageIssues } from "./storageStatus";
import createLocalTasksRepository from "./tasksRepository";

const TODAY = "2026-10-10";
const TASK_ID = "11111111-1111-4111-8111-111111111111";
const GROUP_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function createSeededRepository(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  return createLocalTasksRepository({ today: TODAY });
}

runTasksRepositoryContract("local", createSeededRepository);

describe("local tasks repository", () => {
  it("starts with the demo tasks for today on the first launch", () => {
    const repository = createLocalTasksRepository({ today: TODAY });

    expect(repository.getSnapshot()).toEqual(createInitialTasks(TODAY));
  });

  it("writes the demo tasks to storage when it starts", async () => {
    const repository = createLocalTasksRepository({ today: TODAY });

    await repository.start();

    expect(JSON.parse(localStorage.getItem("tasks"))).toEqual(
      createInitialTasks(TODAY),
    );
  });

  it("fills in the fields that older saved tasks do not have", () => {
    const repository = createSeededRepository([
      {
        id: TASK_ID,
        title: "Old",
        category: "Work",
        date: "",
        completed: false,
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        title: "Old 2",
        category: "Work",
        date: "",
        completed: false,
      },
    ]);

    expect(repository.getSnapshot()[1]).toMatchObject({
      description: "",
      steps: [],
      completedAt: null,
      order: 1,
      repeat: "none",
      repeatGroupId: null,
      attachments: [],
    });
  });

  it("keeps the saved values over the filled-in defaults", () => {
    const repository = createSeededRepository([
      { id: TASK_ID, title: "Old", order: 7, description: "Kept" },
    ]);

    expect(repository.getSnapshot()[0]).toMatchObject({
      order: 7,
      description: "Kept",
    });
  });

  it("adds the future copies of a repeating task when it reads the tasks", () => {
    const repository = createSeededRepository([
      {
        id: TASK_ID,
        title: "Water",
        category: "Health",
        date: TODAY,
        completed: false,
        repeat: "weekly",
        repeatGroupId: GROUP_ID,
      },
    ]);

    const tasks = repository.getSnapshot();

    expect(tasks[0].id).toBe(TASK_ID);
    expect(tasks.length).toBeGreaterThan(1);
    expect(tasks[1]).toMatchObject({
      date: "2026-10-17",
      repeatGroupId: GROUP_ID,
      completed: false,
    });
  });

  it("saves the tasks under the same key and format after a change", async () => {
    const repository = createSeededRepository([]);
    const task = { id: TASK_ID, title: "New" };

    await repository.create(task);

    expect(localStorage.getItem("tasks")).toBe(JSON.stringify([task]));
  });

  it.each([
    ["corrupt JSON", "{broken"],
    ["data that is not a list", JSON.stringify({ not: "a list" })],
  ])(
    "falls back to the demo tasks and reports a read issue for %s",
    async (_label, rawValue) => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      localStorage.setItem("tasks", rawValue);
      const repository = createLocalTasksRepository({ today: TODAY });

      await repository.start();

      expect(repository.getSnapshot()).toEqual(createInitialTasks(TODAY));
      expect(localStorage.getItem("tasks:corrupt")).toBe(rawValue);
      expect(getStorageIssues()).toEqual([{ key: "tasks", kind: "read" }]);
    },
  );

  it("writes the list to storage once when several tasks change together", async () => {
    const repository = createSeededRepository([
      { id: TASK_ID, title: "One" },
      { id: "22222222-2222-4222-8222-222222222222", title: "Two" },
    ]);
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    await repository.updateMany([
      { id: TASK_ID, patch: { projectId: null } },
      {
        id: "22222222-2222-4222-8222-222222222222",
        patch: { projectId: null },
      },
    ]);

    expect(setItem).toHaveBeenCalledTimes(1);
  });
});
