import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import App from "./App";

function createTask(id, title, date) {
  return {
    id,
    title,
    category: "Work",
    date,
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

function openTodayPage() {
  act(() => {
    screen.getAllByRole("button", { name: /^Today/ })[0].click();
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.setItem("language", JSON.stringify("en"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("App and day changes", () => {
  it("shows tomorrow's task on the Today page after midnight", () => {
    vi.setSystemTime(new Date(2026, 9, 10, 23, 59, 50));
    localStorage.setItem(
      "tasks",
      JSON.stringify([
        createTask("a", "Tomorrow task", "2026-10-11"),
        createTask("b", "Today task", "2026-10-10"),
      ]),
    );

    render(<App />);
    openTodayPage();

    expect(screen.queryByText("Tomorrow task")).not.toBeInTheDocument();
    expect(screen.getByText("Today task")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(11_000);
    });

    expect(screen.getByText("Tomorrow task")).toBeInTheDocument();
    expect(screen.queryByText("Today task")).not.toBeInTheDocument();
  });

  it("shows today's task at 00:30 (still yesterday in UTC)", () => {
    vi.setSystemTime(new Date("2026-10-08T21:30:00Z"));
    localStorage.setItem(
      "tasks",
      JSON.stringify([createTask("a", "October 9 task", "2026-10-09")]),
    );

    render(<App />);
    openTodayPage();

    expect(screen.getByText("October 9 task")).toBeInTheDocument();
  });
});