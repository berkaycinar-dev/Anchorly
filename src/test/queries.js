import { screen, within } from "@testing-library/react";

export function getTaskItem(title) {
  return screen.getByText(title).closest("li");
}

export function queryTaskItem(title) {
  const element = screen.queryByText(title);

  return element ? element.closest("li") : null;
}

export function getTaskCheckbox(title) {
  return within(getTaskItem(title)).getByRole("checkbox");
}

export function getDeleteButton(title) {
  return within(getTaskItem(title)).getByRole("button", {
    name: `Delete "${title}"`,
  });
}

export function getFilterButton(name) {
  return screen.getByRole("button", { name });
}

export function getCompletedToggle(count) {
  return screen.getByText(`Completed (${count})`);
}

export function getSidebarLink(name) {
  return within(screen.getByRole("navigation")).getByRole("link", { name });
}

export function getSidebarBadge(name) {
  return getSidebarLink(name).querySelector(".nav-badge");
}

export function getTaskTitleButton(title) {
  return screen.getByRole("button", { name: title });
}

export function getMoveButton(title, direction) {
  return screen.getByRole("button", {
    name: `Move "${title}" ${direction}`,
  });
}