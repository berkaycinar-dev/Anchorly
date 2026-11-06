import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { strings } from "../../strings";
import DataLoadingScreen, { SLOW_LOADING_MS } from "./DataLoadingScreen";

const t = strings.tr;

describe("DataLoadingScreen", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows only the loading text at first", () => {
    render(<DataLoadingScreen />);

    expect(screen.getByText(t.dataLoading)).toBeInTheDocument();
    expect(screen.queryByText(t.dataLoadingSlow)).not.toBeInTheDocument();
  });

  it("explains the wait once loading takes long", () => {
    render(<DataLoadingScreen />);

    act(() => {
      vi.advanceTimersByTime(SLOW_LOADING_MS - 1);
    });
    expect(screen.queryByText(t.dataLoadingSlow)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText(t.dataLoading)).toBeInTheDocument();
    expect(screen.getByText(t.dataLoadingSlow)).toBeInTheDocument();
  });

  it("stops the timer when it is removed", () => {
    const { unmount } = render(<DataLoadingScreen />);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
