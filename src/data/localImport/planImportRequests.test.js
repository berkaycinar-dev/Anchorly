import { describe, expect, it } from "vitest";
import planImportRequests from "./planImportRequests";

function payload(taskCount, checkCount = 0) {
  return {
    projects: [{ id: "p", name: "Project" }],
    routines: [{ id: "r", title: "Routine" }],
    routineChecks: Array.from({ length: checkCount }, (_, index) => ({
      routineId: "r",
      date: `2026-01-${index}`,
      checked: true,
    })),
    tasks: Array.from({ length: taskCount }, (_, index) => ({
      id: `t${index}`,
      title: "x".repeat(100),
    })),
  };
}

describe("planImportRequests", () => {
  it("sends one request when everything fits", () => {
    const body = payload(3, 2);

    expect(planImportRequests(body)).toEqual([body]);
  });

  it("splits a large payload into staged requests", () => {
    const body = payload(30, 20);

    const requests = planImportRequests(body, 1500);

    expect(requests.length).toBeGreaterThan(2);
    expect(requests[0].projects).toEqual(body.projects);
    expect(requests[0].routines).toEqual(body.routines);
    expect(requests[0].tasks).toEqual([]);
    expect(
      requests.slice(1).every((request) => request.projects.length === 0),
    ).toBe(true);
  });

  it("keeps every task and check exactly once and in order", () => {
    const body = payload(30, 20);

    const requests = planImportRequests(body, 1500);

    expect(requests.flatMap((request) => request.tasks)).toEqual(body.tasks);
    expect(requests.flatMap((request) => request.routineChecks)).toEqual(
      body.routineChecks,
    );
  });

  it("keeps each request under the limit", () => {
    const requests = planImportRequests(payload(30, 20), 1500);
    const encoder = new TextEncoder();

    requests.slice(1).forEach((request) => {
      expect(encoder.encode(JSON.stringify(request)).length).toBeLessThan(
        1500 + 200,
      );
    });
  });

  it("puts an item that is larger than the limit in a request of its own", () => {
    const body = payload(2);
    body.tasks[0].title = "y".repeat(3000);

    const requests = planImportRequests(body, 1000);

    expect(requests.flatMap((request) => request.tasks)).toHaveLength(2);
  });
});
