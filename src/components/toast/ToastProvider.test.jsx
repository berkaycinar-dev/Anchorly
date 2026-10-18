import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { useEffect } from "react";
import ToastProvider from "./ToastProvider";
import { useToast } from "./useToast";

function Capture({ onReady }) {
  const toast = useToast();

  useEffect(() => {
    onReady(toast);
  }, [toast, onReady]);

  return null;
}

function renderWithToast() {
  const handle = { current: null };
  const onReady = (toast) => {
    handle.current = toast;
  };

  render(
    <ToastProvider closeLabel="Close">
      <Capture onReady={onReady} />
    </ToastProvider>,
  );

  return handle;
}

function advance(milliseconds) {
  act(() => {
    vi.advanceTimersByTime(milliseconds);
  });
}

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders no toast by default", () => {
    renderWithToast();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an info toast as a status", () => {
    const handle = renderWithToast();

    act(() => {
      handle.current.info("Info message");
    });

    expect(screen.getByRole("status")).toHaveTextContent("Info message");
  });

  it("shows a success toast as a status", () => {
    const handle = renderWithToast();

    act(() => {
      handle.current.success("Success message");
    });

    expect(screen.getByRole("status")).toHaveTextContent("Success message");
  });

  it("shows an error toast as an alert", () => {
    const handle = renderWithToast();

    act(() => {
      handle.current.error("Error message");
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Error message");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("closes a toast after five seconds", () => {
    const handle = renderWithToast();

    act(() => {
      handle.current.info("Info message");
    });

    advance(4999);

    expect(screen.getByRole("status")).toBeInTheDocument();

    advance(1);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("closes a toast with the close button", () => {
    const handle = renderWithToast();

    act(() => {
      handle.current.info("Info message");
    });

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("uses the close label passed to the provider", () => {
    const handle = renderWithToast();

    act(() => {
      handle.current.info("Info message");
    });

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("returns an id that dismisses the toast", () => {
    const handle = renderWithToast();
    let id;

    act(() => {
      id = handle.current.info("Info message");
    });

    expect(typeof id).toBe("string");

    act(() => {
      handle.current.dismiss(id);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps the other toasts when one is dismissed by id", () => {
    const handle = renderWithToast();
    let firstId;

    act(() => {
      firstId = handle.current.info("First message");
      handle.current.info("Second message");
    });

    act(() => {
      handle.current.dismiss(firstId);
    });

    expect(screen.queryByText("First message")).not.toBeInTheDocument();
    expect(screen.getByText("Second message")).toBeInTheDocument();
  });

  it("shows at most three toasts and drops the oldest", () => {
    const handle = renderWithToast();

    act(() => {
      handle.current.info("Message 1");
      handle.current.info("Message 2");
      handle.current.info("Message 3");
      handle.current.info("Message 4");
    });

    expect(screen.queryByText("Message 1")).not.toBeInTheDocument();
    expect(screen.getByText("Message 2")).toBeInTheDocument();
    expect(screen.getByText("Message 3")).toBeInTheDocument();
    expect(screen.getByText("Message 4")).toBeInTheDocument();
  });

  it("pauses the timer while the pointer is over the toast", () => {
    const handle = renderWithToast();

    act(() => {
      handle.current.info("Info message");
    });

    fireEvent.mouseEnter(screen.getByRole("status"));
    advance(20000);

    expect(screen.getByRole("status")).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole("status"));
    advance(4999);

    expect(screen.getByRole("status")).toBeInTheDocument();

    advance(1);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("pauses the timer while the toast has keyboard focus", () => {
    const handle = renderWithToast();

    act(() => {
      handle.current.info("Info message");
    });

    act(() => {
      screen.getByRole("button", { name: "Close" }).focus();
    });

    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    advance(20000);

    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      screen.getByRole("button", { name: "Close" }).blur();
    });

    advance(5000);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps the timer paused until both pointer and focus leave", () => {
    const handle = renderWithToast();

    act(() => {
      handle.current.info("Info message");
    });

    fireEvent.mouseEnter(screen.getByRole("status"));

    act(() => {
      screen.getByRole("button", { name: "Close" }).focus();
    });

    fireEvent.mouseLeave(screen.getByRole("status"));
    advance(20000);

    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      screen.getByRole("button", { name: "Close" }).blur();
    });

    advance(5000);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("times each toast independently", () => {
    const handle = renderWithToast();

    act(() => {
      handle.current.info("First message");
    });

    advance(3000);

    act(() => {
      handle.current.info("Second message");
    });

    advance(2000);

    expect(screen.queryByText("First message")).not.toBeInTheDocument();
    expect(screen.getByText("Second message")).toBeInTheDocument();

    advance(3000);

    expect(screen.queryByText("Second message")).not.toBeInTheDocument();
  });

  it("throws a clear error when useToast is used outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Capture onReady={() => {}} />)).toThrow(
      "useToast must be used within a ToastProvider",
    );
  });
});