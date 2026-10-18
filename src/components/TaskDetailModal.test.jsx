import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { useEffect } from "react";
import TaskDetailModal from "./TaskDetailModal";
import ToastProvider from "./toast/ToastProvider";
import { useToast } from "./toast/useToast";
import { strings } from "../strings";

const TASK_ID = "11111111-1111-4111-8111-111111111111";

function createTask(overrides = {}) {
  return {
    id: TASK_ID,
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
    ...overrides,
  };
}

function ToastCapture({ onReady }) {
  const toast = useToast();

  useEffect(() => {
    onReady(toast);
  }, [toast, onReady]);

  return null;
}

function renderModal(overrides = {}) {
  const props = {
    task: createTask(),
    onClose: vi.fn(),
    onToggleTask: vi.fn(),
    onUpdateTitle: vi.fn(),
    onUpdateDate: vi.fn(),
    onUpdateDescription: vi.fn(),
    onAddStep: vi.fn(),
    onToggleStep: vi.fn(),
    onDeleteStep: vi.fn(),
    onUpdateRepeat: vi.fn(),
    onAddAttachment: vi.fn(),
    onDeleteAttachment: vi.fn(),
    projects: [],
    onAssignProject: vi.fn(),
    onDeleteTask: vi.fn(),
    t: strings.en,
    ...overrides,
  };
  const toastHandle = { current: null };
  const onToastReady = (toast) => {
    toastHandle.current = toast;
  };

  const view = render(
    <ToastProvider closeLabel="Close">
      <ToastCapture onReady={onToastReady} />
      <TaskDetailModal {...props} />
    </ToastProvider>,
  );

  return { props, toastHandle, ...view };
}

function getDialog() {
  return screen.getByRole("dialog", { name: "Task 1" });
}

describe("TaskDetailModal dialog", () => {
  it("opens as a modal dialog on mount", () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");

    renderModal();

    expect(showModal).toHaveBeenCalledTimes(1);
    expect(getDialog()).toHaveAttribute("open");
  });

  it("is named by the task title", () => {
    renderModal({ task: createTask({ title: "Write report" }) });

    expect(
      screen.getByRole("dialog", { name: "Write report" }),
    ).toBeInTheDocument();
  });

  it("keeps its name while the title is being edited", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.dblClick(screen.getByRole("heading", { name: "Task 1" }));

    expect(screen.getByDisplayValue("Task 1")).toBeInTheDocument();
    expect(getDialog()).toBeInTheDocument();
  });

  it("renders nothing and never opens when there is no task", () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");

    renderModal({ task: null });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(showModal).not.toHaveBeenCalled();
  });

  it("calls onClose when the Close button is pressed", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the dialog closes natively", () => {
    const { props } = renderModal();

    fireEvent(getDialog(), new Event("close"));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.click(getDialog());

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open when the content is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.click(screen.getByRole("heading", { name: "Task 1" }));

    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("stays open when a press starts inside and ends on the backdrop", () => {
    const { props } = renderModal();
    const dialog = getDialog();

    fireEvent.mouseDown(screen.getByRole("heading", { name: "Task 1" }));
    fireEvent.mouseUp(dialog);
    fireEvent.click(dialog);

    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("blocks the native cancel while the title is being edited", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.dblClick(screen.getByRole("heading", { name: "Task 1" }));

    const wasNotPrevented = fireEvent(
      getDialog(),
      new Event("cancel", { cancelable: true }),
    );

    expect(wasNotPrevented).toBe(false);
  });

  it("allows the native cancel when the title is not being edited", () => {
    renderModal();

    const wasNotPrevented = fireEvent(
      getDialog(),
      new Event("cancel", { cancelable: true }),
    );

    expect(wasNotPrevented).toBe(true);
  });

  it("cancels the title edit on Escape without closing", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.dblClick(screen.getByRole("heading", { name: "Task 1" }));

    const wasNotPrevented = fireEvent.keyDown(
      screen.getByDisplayValue("Task 1"),
      { key: "Escape" },
    );

    expect(wasNotPrevented).toBe(false);
    expect(screen.getByRole("heading", { name: "Task 1" })).toBeInTheDocument();
    expect(props.onUpdateTitle).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("moves focus to the title when it opens", () => {
    renderModal();

    expect(screen.getByRole("heading", { name: "Task 1" })).toHaveFocus();
  });

  it("gives focus back to the element that opened it", () => {
    const opener = document.createElement("button");

    document.body.appendChild(opener);
    opener.focus();

    const { unmount } = renderModal();

    screen.getByRole("checkbox").focus();

    expect(opener).not.toHaveFocus();

    unmount();

    expect(opener).toHaveFocus();

    opener.remove();
  });
});

describe("TaskDetailModal delete confirmation", () => {
  async function openConfirmation(user) {
    const view = renderModal();

    await user.click(screen.getByRole("button", { name: "Delete task" }));

    return view;
  }

  it("asks for confirmation before deleting", async () => {
    const user = userEvent.setup();
    const { props } = await openConfirmation(user);

    expect(
      screen.getByRole("alertdialog", { name: /delete "Task 1"/ }),
    ).toBeInTheDocument();
    expect(props.onDeleteTask).not.toHaveBeenCalled();
  });

  it("closes only the confirmation when it is dismissed natively", async () => {
    const user = userEvent.setup();
    const { props } = await openConfirmation(user);

    fireEvent(screen.getByRole("alertdialog"), new Event("close"));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(getDialog()).toBeInTheDocument();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("closes only the confirmation when Cancel is pressed", async () => {
    const user = userEvent.setup();
    const { props } = await openConfirmation(user);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(props.onDeleteTask).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("closes only the confirmation when its backdrop is clicked", async () => {
    const user = userEvent.setup();
    const { props } = await openConfirmation(user);

    await user.click(screen.getByRole("alertdialog"));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("deletes the task and closes when confirmed", async () => {
    const user = userEvent.setup();
    const { props } = await openConfirmation(user);

    await user.click(screen.getByRole("button", { name: "Yes, Delete" }));

    expect(props.onDeleteTask).toHaveBeenCalledWith(TASK_ID);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

describe("TaskDetailModal toasts", () => {
  it("shows toasts inside the dialog so they stay usable", () => {
    const { toastHandle } = renderModal();

    act(() => {
      toastHandle.current.error("Something went wrong");
    });

    expect(within(getDialog()).getByRole("alert")).toHaveTextContent(
      "Something went wrong",
    );
  });

  it("moves toasts back to the page when the dialog is gone", () => {
    const { toastHandle, rerender, props } = renderModal();

    act(() => {
      toastHandle.current.error("Something went wrong");
    });

    rerender(
      <ToastProvider closeLabel="Close">
        <ToastCapture onReady={() => {}} />
        <TaskDetailModal {...props} task={null} />
      </ToastProvider>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });
});

describe("TaskDetailModal attachments", () => {
  const ONE_MEGABYTE = 1024 * 1024;

  function getFileInput() {
    return getDialog().querySelector('input[type="file"]');
  }

  function createFile(name, type, size) {
    return new File([new Uint8Array(size)], name, { type });
  }

  it("rejects a file over 1 MB with a toast inside the dialog", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { props } = renderModal();

    await user.upload(
      getFileInput(),
      createFile("big.png", "image/png", ONE_MEGABYTE + 1),
    );

    expect(within(getDialog()).getByRole("alert")).toHaveTextContent(
      strings.en.fileTooLargeWarning,
    );
    expect(alertSpy).not.toHaveBeenCalled();
    expect(props.onAddAttachment).not.toHaveBeenCalled();
  });

  it("accepts a file of exactly 1 MB without a warning", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.upload(
      getFileInput(),
      createFile("limit.txt", "text/plain", ONE_MEGABYTE),
    );

    await waitFor(() => expect(props.onAddAttachment).toHaveBeenCalledTimes(1));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("adds a small file to the task", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.upload(getFileInput(), createFile("note.txt", "text/plain", 10));

    await waitFor(() => expect(props.onAddAttachment).toHaveBeenCalledTimes(1));

    expect(props.onAddAttachment).toHaveBeenCalledWith(
      TASK_ID,
      expect.objectContaining({
        name: "note.txt",
        type: "text/plain",
        data: expect.stringMatching(/^data:/),
      }),
    );
  });
});