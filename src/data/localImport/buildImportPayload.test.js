import { describe, expect, it } from "vitest";
import { createInitialTasks } from "../../constants/initialData";
import { initialProjects, initialRoutines } from "../../constants/initialData";
import buildImportPayload, { IMPORT_LIMITS } from "./buildImportPayload";

const ids = {
  task: "aaaaaaaa-0000-4000-8000-000000000001",
  task2: "aaaaaaaa-0000-4000-8000-000000000002",
  project: "bbbbbbbb-0000-4000-8000-000000000001",
  routine: "cccccccc-0000-4000-8000-000000000001",
  step: "dddddddd-0000-4000-8000-000000000001",
  group: "eeeeeeee-0000-4000-8000-000000000001",
};

function task(overrides = {}) {
  return {
    id: ids.task,
    title: "Write",
    category: "Work",
    date: "2026-11-05",
    completed: false,
    completedAt: null,
    projectId: null,
    description: "",
    steps: [],
    order: 0,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
    ...overrides,
  };
}

function build(overrides = {}) {
  return buildImportPayload({
    tasks: [],
    projects: [],
    routines: [],
    checks: {},
    ...overrides,
  });
}

describe("buildImportPayload", () => {
  it("returns an empty payload and no data for empty input", () => {
    const result = build();

    expect(result.hasData).toBe(false);
    expect(result.payload).toEqual({
      projects: [],
      routines: [],
      routineChecks: [],
      tasks: [],
    });
  });

  it("keeps the fields of a valid task and drops the attachments", () => {
    const result = build({
      tasks: [
        task({
          title: "  Write  ",
          steps: [{ id: ids.step, text: "Draft", done: true }],
          attachments: [{ id: "x", data: "base64" }],
        }),
      ],
    });

    expect(result.payload.tasks).toEqual([
      {
        id: ids.task,
        title: "Write",
        category: "Work",
        date: "2026-11-05",
        completed: false,
        completedAt: null,
        projectId: null,
        description: "",
        steps: [{ id: ids.step, text: "Draft", done: true }],
        order: 0,
        repeat: "none",
        repeatGroupId: null,
      },
    ]);
    expect(result.summary).toEqual({
      tasks: 1,
      routines: 0,
      projects: 0,
      routineChecks: 0,
    });
    expect(result.hasData).toBe(true);
  });

  it("turns invalid values into safe ones", () => {
    const result = build({
      tasks: [
        task({
          category: "Weird",
          date: "2026-13-40",
          completed: false,
          completedAt: "2026-11-01",
          projectId: "not-a-uuid",
          repeat: "monthly",
          repeatGroupId: "nope",
          order: -3,
          description: 5,
        }),
      ],
    });

    expect(result.payload.tasks[0]).toMatchObject({
      category: "Work",
      date: "",
      completedAt: null,
      projectId: null,
      repeat: "none",
      repeatGroupId: null,
      order: 0,
      description: "",
    });
  });

  it("keeps a valid completion date for a completed task", () => {
    const result = build({
      tasks: [task({ completed: true, completedAt: "2026-11-04" })],
    });

    expect(result.payload.tasks[0]).toMatchObject({
      completed: true,
      completedAt: "2026-11-04",
    });
  });

  it("drops tasks without a valid id or title", () => {
    const result = build({
      tasks: [
        task({ id: "legacy-1" }),
        task({ id: ids.task2, title: "   " }),
        null,
        "text",
        task(),
      ],
    });

    expect(result.payload.tasks.map((item) => item.id)).toEqual([ids.task]);
  });

  it("keeps only valid steps and limits their text", () => {
    const result = build({
      tasks: [
        task({
          steps: [
            { id: ids.step, text: "ok", done: true },
            { id: "bad", text: "bad id", done: false },
            { id: ids.step, text: "", done: false },
            { id: ids.step, text: "x".repeat(600), done: false },
          ],
        }),
      ],
    });

    expect(result.payload.tasks[0].steps).toHaveLength(2);
    expect(result.payload.tasks[0].steps[1].text).toHaveLength(500);
  });

  it("keeps the first of repeated task ids", () => {
    const result = build({
      tasks: [task({ title: "First" }), task({ title: "Second" })],
    });

    expect(result.payload.tasks.map((item) => item.title)).toEqual(["First"]);
  });

  it("falls back to the position for a missing order", () => {
    const result = build({
      tasks: [task({ id: ids.task2, order: undefined }), task({ order: 4 })],
    });

    expect(result.payload.tasks.map((item) => item.order)).toEqual([0, 4]);
  });

  it("limits the number of tasks", () => {
    const many = Array.from({ length: IMPORT_LIMITS.tasks + 3 }, (_, index) =>
      task({
        id: `ffffffff-0000-4000-8000-${String(index).padStart(12, "0")}`,
        order: index,
      }),
    );

    expect(build({ tasks: many }).payload.tasks).toHaveLength(
      IMPORT_LIMITS.tasks,
    );
  });

  describe("demo data", () => {
    it("has no data when only the untouched demo is stored", () => {
      const result = build({
        tasks: createInitialTasks("2026-10-01"),
        projects: initialProjects,
        routines: initialRoutines,
      });

      expect(result.hasData).toBe(false);
      expect(result.payload.tasks).toEqual([]);
      expect(result.payload.projects).toEqual([]);
      expect(result.payload.routines).toEqual([]);
    });

    it("ignores the dates of a demo task because they move with the day", () => {
      const [demo] = createInitialTasks("2026-10-01");

      expect(build({ tasks: [{ ...demo, date: "2026-10-20" }] }).hasData).toBe(
        false,
      );
    });

    it("keeps a demo task whose title was edited", () => {
      const [demo] = createInitialTasks("2026-10-01");

      const result = build({ tasks: [{ ...demo, title: "Mine now" }] });

      expect(result.payload.tasks.map((item) => item.title)).toEqual([
        "Mine now",
      ]);
    });

    it("keeps a demo task that was completed or got steps", () => {
      const [first, second] = createInitialTasks("2026-10-01");

      const result = build({
        tasks: [
          { ...first, completed: true, completedAt: "2026-10-02" },
          { ...second, steps: [{ id: ids.step, text: "s", done: false }] },
        ],
      });

      expect(result.payload.tasks).toHaveLength(2);
    });

    it("keeps a demo project that a real task uses", () => {
      const demoProject = initialProjects[0];

      const result = build({
        tasks: [task({ projectId: demoProject.id })],
        projects: initialProjects,
      });

      expect(result.payload.projects).toEqual([demoProject]);
    });

    it("keeps a demo project whose name was changed", () => {
      const result = build({
        projects: [{ ...initialProjects[0], name: "Renamed" }],
      });

      expect(result.payload.projects).toEqual([
        { id: initialProjects[0].id, name: "Renamed" },
      ]);
    });

    it("keeps a demo routine that has checks", () => {
      const demoRoutine = initialRoutines[0];

      const result = build({
        routines: initialRoutines,
        checks: { [`2026-11-${demoRoutine.id}-3`]: true },
      });

      expect(result.payload.routines).toEqual([demoRoutine]);
      expect(result.payload.routineChecks).toEqual([
        { routineId: demoRoutine.id, date: "2026-11-03", checked: true },
      ]);
    });
  });

  describe("projects and routines", () => {
    it("keeps valid projects and routines in order", () => {
      const result = build({
        projects: [
          { id: ids.project, name: " Alpha " },
          { id: "legacy", name: "Skipped" },
          { id: "bbbbbbbb-0000-4000-8000-000000000002", name: "" },
        ],
        routines: [{ id: ids.routine, title: "Run" }, null],
      });

      expect(result.payload.projects).toEqual([
        { id: ids.project, name: "Alpha" },
      ]);
      expect(result.payload.routines).toEqual([
        { id: ids.routine, title: "Run" },
      ]);
    });
  });

  describe("routine checks", () => {
    it("converts the local keys into dates", () => {
      const result = build({
        routines: [{ id: ids.routine, title: "Run" }],
        checks: {
          [`2026-11-${ids.routine}-5`]: true,
          [`2026-1-${ids.routine}-12`]: true,
        },
      });

      expect(result.payload.routineChecks).toEqual([
        { routineId: ids.routine, date: "2026-11-05", checked: true },
        { routineId: ids.routine, date: "2026-01-12", checked: true },
      ]);
    });

    it("drops unchecked marks, bad keys and checks of unknown routines", () => {
      const result = build({
        routines: [{ id: ids.routine, title: "Run" }],
        checks: {
          [`2026-11-${ids.routine}-5`]: false,
          [`2026-11-${ids.routine}-31`]: true,
          [`2026-11-bbbbbbbb-0000-4000-8000-0000000000aa-5`]: true,
          garbage: true,
        },
      });

      expect(result.payload.routineChecks).toEqual([]);
    });
  });

  it("handles input that is not a list or a map", () => {
    const result = buildImportPayload({
      tasks: null,
      projects: undefined,
      routines: "x",
      checks: [],
    });

    expect(result.hasData).toBe(false);
  });
});
