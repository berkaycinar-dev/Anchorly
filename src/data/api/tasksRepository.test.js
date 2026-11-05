import { describe, it, expect } from "vitest";
import { createOccurrenceId } from "../../lib/id";
import createFakeApiClient from "../../test/fakeApiClient";
import { runTasksRepositoryContract } from "../contracts/tasksRepository.contract";
import { ApiError } from "./ApiError";
import createApiTasksRepository from "./tasksRepository";

const TODAY = "2026-10-10";
const GROUP_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function createTask(id, overrides = {}) {
  return {
    id,
    title: `Task ${id.slice(0, 4)}`,
    category: "Work",
    date: TODAY,
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
const SECOND = createTask("22222222-2222-4222-8222-222222222222", { order: 1 });
const THIRD = createTask("33333333-3333-4333-8333-333333333333", { order: 2 });
const NEW_TASK = createTask("44444444-4444-4444-8444-444444444444", {
  order: 99,
});
const ATTACHMENT = { id: "file-1", name: "note.txt", data: "abc" };
const REPEATING = createTask("55555555-5555-4555-8555-555555555555", {
  repeat: "daily",
  repeatGroupId: GROUP_ID,
});

function createSubject(tasks = [FIRST, SECOND, THIRD], client) {
  const apiClient = client ?? createFakeApiClient({ tasks });
  const repository = createApiTasksRepository({
    client: apiClient,
    today: TODAY,
  });

  return { client: apiClient, repository };
}

function describeCalls(client) {
  return client.calls.map((call) => `${call.method} ${call.path}`);
}

function getBulkOperations(client) {
  return client.calls
    .filter((call) => call.path === "/tasks/bulk")
    .map((call) => call.body.operations);
}

function findTask(repository, id) {
  return repository.getSnapshot().find((task) => task.id === id);
}

runTasksRepositoryContract("api", (tasks) => createSubject(tasks).repository);

describe("api tasks repository", () => {
  it("starts loading with an empty list", () => {
    const { repository } = createSubject();

    expect(repository.getStatus()).toBe("loading");
    expect(repository.getSnapshot()).toEqual([]);
  });

  it("loads the tasks from the server when it starts", async () => {
    const { client, repository } = createSubject();

    await repository.start();

    expect(repository.getSnapshot()).toEqual([FIRST, SECOND, THIRD]);
    expect(describeCalls(client)).toEqual(["GET /tasks"]);
  });

  it("sends only the fields the server stores when it creates a task", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.create({
      ...NEW_TASK,
      attachments: [ATTACHMENT],
      boardStatus: "doing",
    });

    const { body } = client.calls.at(-1);

    expect(client.calls.at(-1).path).toBe("/tasks");
    expect(body).not.toHaveProperty("attachments");
    expect(body).not.toHaveProperty("boardStatus");
    expect(body.id).toBe(NEW_TASK.id);
  });

  it("keeps attachments and board status on this device", async () => {
    const { repository } = createSubject();
    await repository.start();

    await repository.create({
      ...NEW_TASK,
      attachments: [ATTACHMENT],
      boardStatus: "doing",
    });

    expect(findTask(repository, NEW_TASK.id)).toMatchObject({
      attachments: [ATTACHMENT],
      boardStatus: "doing",
    });
  });

  it("shows the local fields again after a reload", async () => {
    const { client, repository } = createSubject();
    await repository.start();
    await repository.create({ ...NEW_TASK, attachments: [ATTACHMENT] });

    const reloaded = createSubject(undefined, client).repository;
    await reloaded.start();

    expect(findTask(reloaded, NEW_TASK.id).attachments).toEqual([ATTACHMENT]);
  });

  it("stores a change of local fields without a request", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.update(FIRST.id, {
      ...FIRST,
      attachments: [ATTACHMENT],
      boardStatus: "todo",
    });

    expect(describeCalls(client)).toEqual(["GET /tasks"]);
    expect(findTask(repository, FIRST.id)).toMatchObject({
      attachments: [ATTACHMENT],
      boardStatus: "todo",
    });
  });

  it("removes the local fields of a removed task", async () => {
    const { repository } = createSubject();
    await repository.start();
    await repository.update(FIRST.id, { attachments: [ATTACHMENT] });

    await repository.remove(FIRST.id);

    expect(JSON.parse(localStorage.getItem("taskLocalFields"))).toEqual({});
  });

  it("sends only the fields that changed when it updates a task", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.update(SECOND.id, {
      ...SECOND,
      title: "Renamed",
      attachments: [ATTACHMENT],
    });

    expect(getBulkOperations(client)).toEqual([
      [{ type: "update", id: SECOND.id, patch: { title: "Renamed" } }],
    ]);
  });

  it("sends completed and completedAt together", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.update(SECOND.id, {
      completed: true,
      completedAt: TODAY,
    });
    await repository.update(SECOND.id, {
      completed: false,
      completedAt: null,
    });

    expect(
      getBulkOperations(client).map((operations) => operations[0].patch),
    ).toEqual([
      { completed: true, completedAt: TODAY },
      { completed: false, completedAt: null },
    ]);
  });

  it("sends completedAt along with completed even when only completed changed", async () => {
    const doneWithoutDate = createTask(NEW_TASK.id, {
      completed: true,
      completedAt: null,
    });
    const { client, repository } = createSubject([doneWithoutDate]);
    await repository.start();

    await repository.update(NEW_TASK.id, {
      completed: false,
      completedAt: null,
    });

    expect(getBulkOperations(client)[0][0].patch).toEqual({
      completed: false,
      completedAt: null,
    });
  });

  it("sends nothing when an update changes nothing", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.update(SECOND.id, { ...SECOND });

    expect(describeCalls(client)).toEqual(["GET /tasks"]);
  });

  it("sends several updates in one request", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.updateMany([
      { id: FIRST.id, patch: { title: "One" } },
      { id: THIRD.id, patch: { title: "Three" } },
    ]);

    expect(getBulkOperations(client)).toEqual([
      [
        { type: "update", id: FIRST.id, patch: { title: "One" } },
        { type: "update", id: THIRD.id, patch: { title: "Three" } },
      ],
    ]);
  });

  it("creates several tasks in one request", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.createMany([NEW_TASK, { ...NEW_TASK, id: GROUP_ID }]);

    expect(getBulkOperations(client)).toHaveLength(1);
    expect(
      getBulkOperations(client)[0].map((operation) => operation.type),
    ).toEqual(["create", "create"]);
  });

  it("splits a large create into several requests of at most 500 tasks", async () => {
    const { client, repository } = createSubject([]);
    await repository.start();
    const tasks = Array.from({ length: 501 }, (_, index) =>
      createTask(createOccurrenceId("bulk", String(index)), { order: index }),
    );

    await repository.createMany(tasks);

    const sizes = getBulkOperations(client).map(
      (operations) => operations.length,
    );

    expect(sizes.length).toBeGreaterThan(1);
    sizes.forEach((size) => expect(size).toBeLessThanOrEqual(500));
    expect(sizes.reduce((total, size) => total + size, 0)).toBe(501);
    expect(client.getStoredTasks()).toHaveLength(501);
  });

  it("splits a large create so each request stays under the size limit", async () => {
    const { client, repository } = createSubject([]);
    await repository.start();
    const tasks = Array.from({ length: 12 }, (_, index) =>
      createTask(createOccurrenceId("big", String(index)), {
        description: "x".repeat(9000),
        order: index,
      }),
    );

    await repository.createMany(tasks);

    const sizes = client.calls
      .filter((call) => call.path === "/tasks/bulk")
      .map((call) => JSON.stringify(call.body).length);

    expect(sizes.length).toBeGreaterThan(1);
    sizes.forEach((size) => expect(size).toBeLessThan(100000));
    expect(client.getStoredTasks()).toHaveLength(12);
  });

  it("deletes several tasks in one request", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.removeMany([FIRST.id, THIRD.id, NEW_TASK.id]);

    expect(getBulkOperations(client)).toEqual([
      [
        { type: "delete", id: FIRST.id },
        { type: "delete", id: THIRD.id },
      ],
    ]);
  });

  it("sends the order only for tasks it knows", async () => {
    const { client, repository } = createSubject();
    await repository.start();

    await repository.reorder([THIRD.id, NEW_TASK.id, FIRST.id]);

    expect(client.calls.at(-1)).toEqual({
      method: "POST",
      path: "/tasks/reorder",
      body: { orderedIds: [THIRD.id, FIRST.id] },
    });
  });

  it("rolls back a rejected create and its local fields", async () => {
    const { client, repository } = createSubject();
    await repository.start();
    client.failNext();

    await expect(
      repository.create({ ...NEW_TASK, attachments: [ATTACHMENT] }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(repository.getSnapshot()).toEqual([FIRST, SECOND, THIRD]);
    expect(JSON.parse(localStorage.getItem("taskLocalFields"))).toEqual({});
  });

  it("rolls back a rejected update", async () => {
    const { client, repository } = createSubject();
    await repository.start();
    client.failNext();

    await expect(
      repository.update(FIRST.id, { title: "Renamed" }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(findTask(repository, FIRST.id)).toEqual(FIRST);
  });

  it("brings a task back with its attachments when its removal is rejected", async () => {
    const { client, repository } = createSubject();
    await repository.start();
    await repository.update(FIRST.id, { attachments: [ATTACHMENT] });
    client.failNext();

    await expect(repository.remove(FIRST.id)).rejects.toBeInstanceOf(ApiError);

    expect(findTask(repository, FIRST.id)).toEqual({
      ...FIRST,
      attachments: [ATTACHMENT],
    });
  });

  it("rolls back a rejected reorder", async () => {
    const { client, repository } = createSubject();
    await repository.start();
    client.failNext();

    await expect(
      repository.reorder([THIRD.id, FIRST.id]),
    ).rejects.toBeInstanceOf(ApiError);

    expect(findTask(repository, THIRD.id).order).toBe(THIRD.order);
    expect(findTask(repository, FIRST.id).order).toBe(FIRST.order);
  });

  describe("future copies of repeating tasks", () => {
    it("creates the missing copies on the server when it starts", async () => {
      const { client, repository } = createSubject([REPEATING]);

      await repository.start();

      expect(repository.getSnapshot()).toHaveLength(121);
      expect(client.getStoredTasks()).toHaveLength(121);
    });

    it("gives every copy an id made from its series and date", async () => {
      const { repository } = createSubject([REPEATING]);

      await repository.start();

      const copy = repository
        .getSnapshot()
        .find((task) => task.date === "2026-10-11");

      expect(copy.id).toBe(createOccurrenceId(GROUP_ID, "2026-10-11"));
    });

    it("does not create the copies twice", async () => {
      const { client, repository } = createSubject([REPEATING]);
      await repository.start();

      const second = createSubject(undefined, client).repository;
      await second.start();

      expect(client.getStoredTasks()).toHaveLength(121);
      expect(second.getSnapshot()).toHaveLength(121);
    });

    it("creates no duplicates when two devices start together", async () => {
      const client = createFakeApiClient({ tasks: [REPEATING] });
      const first = createSubject(undefined, client).repository;
      const second = createSubject(undefined, client).repository;

      await Promise.all([first.start(), second.start()]);

      expect(client.getStoredTasks()).toHaveLength(121);
      expect(first.getSnapshot()).toHaveLength(121);
      expect(second.getSnapshot()).toHaveLength(121);
    });

    it("keeps the loaded tasks when creating the copies is rejected", async () => {
      const client = createFakeApiClient({ tasks: [REPEATING] });
      const { repository } = createSubject(undefined, client);
      client.failNextOn("POST", "/tasks/bulk");

      await repository.start();

      expect(repository.getStatus()).toBe("ready");
      expect(repository.getSnapshot()).toEqual([REPEATING]);
      expect(client.getStoredTasks()).toHaveLength(1);
    });
  });
});
