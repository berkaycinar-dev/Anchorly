import { waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
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

describe("main", () => {
  it("migrates legacy ids when the app starts", async () => {
    document.body.innerHTML = '<div id="root"></div>';
    localStorage.setItem("language", JSON.stringify("en"));
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
});
