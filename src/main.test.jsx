import { waitFor } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";
import { isUuid } from "./lib/id";

function createLegacyTask() {
  return {
    id: 1,
    title: "Task 1",
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
  };
}

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = '<div id="root"></div>';
  window.history.pushState({}, "", "/");
  localStorage.setItem("language", JSON.stringify("en"));
});

describe("main", () => {
  it("migrates legacy ids when the app starts", async () => {
    localStorage.setItem("tasks", JSON.stringify([createLegacyTask()]));

    await import("./main.jsx");

    await waitFor(() => {
      expect(document.querySelector(".app")).not.toBeNull();
    });

    const tasks = JSON.parse(localStorage.getItem("tasks"));

    expect(tasks).toHaveLength(1);
    expect(isUuid(tasks[0].id)).toBe(true);
    expect(localStorage.getItem("schemaVersion")).toBe("2");
  });

  it("opens the page that matches the address bar", async () => {
    window.history.pushState({}, "", "/calendar");

    await import("./main.jsx");

    await waitFor(() => {
      expect(document.querySelector(".page-title")).toHaveTextContent(
        "Calendar",
      );
    });
    expect(window.location.pathname).toBe("/calendar");
  });
});