import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { dismiss as dismissStorageIssues } from "../lib/storageStatus";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  dismissStorageIssues();
});