import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { dismiss as dismissStorageIssues } from "../data/local/storageStatus";

HTMLDialogElement.prototype.showModal = function showModal() {
  this.setAttribute("open", "");
};

HTMLDialogElement.prototype.close = function close() {
  if (!this.hasAttribute("open")) {
    return;
  }

  this.removeAttribute("open");
  this.dispatchEvent(new Event("close"));
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  dismissStorageIssues();
});
