import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, it, expect, vi } from "vitest";
import DateField from "./DateField";
import { strings } from "../strings";

function renderField(props = {}) {
  const onChange = vi.fn();

  render(
    <DateField
      label="Date"
      value=""
      onChange={onChange}
      t={strings.en}
      {...props}
    />,
  );

  return { onChange, input: screen.getByLabelText("Date") };
}

afterEach(() => {
  delete HTMLInputElement.prototype.showPicker;
});

describe("DateField", () => {
  it("keeps a native date input with its label", () => {
    const { input } = renderField();

    expect(input).toHaveAttribute("type", "date");
  });

  it("shows a placeholder when no date is set", () => {
    renderField();

    expect(screen.getByText("Pick a date")).toHaveClass(
      "date-field-placeholder",
    );
  });

  it("shows the date in English", () => {
    renderField({ value: "2026-10-18" });

    expect(screen.getByText("October 18, 2026")).toBeInTheDocument();
  });

  it("shows the date in Turkish", () => {
    renderField({ value: "2026-10-18", t: strings.tr });

    expect(screen.getByText("18 Ekim 2026")).toBeInTheDocument();
  });

  it("hides the visible text from screen readers", () => {
    renderField({ value: "2026-10-18" });

    expect(screen.getByText("October 18, 2026")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("passes the new value to onChange", () => {
    const { input, onChange } = renderField();

    fireEvent.change(input, { target: { value: "2026-11-02" } });

    expect(onChange).toHaveBeenCalledWith("2026-11-02");
  });

  it("opens the native picker when the field is clicked", async () => {
    const user = userEvent.setup();
    const showPicker = vi.fn();
    HTMLInputElement.prototype.showPicker = showPicker;
    const { input } = renderField();

    await user.click(input);

    expect(showPicker).toHaveBeenCalledTimes(1);
  });

  it("does not fail when the picker cannot be opened", async () => {
    const user = userEvent.setup();
    const reportedErrors = [];
    const recordError = (event) => {
      event.preventDefault();
      reportedErrors.push(event.error);
    };
    HTMLInputElement.prototype.showPicker = () => {
      throw new DOMException("Not allowed", "NotAllowedError");
    };
    const { input } = renderField();

    window.addEventListener("error", recordError);
    await user.click(input);
    window.removeEventListener("error", recordError);

    expect(reportedErrors).toEqual([]);
  });
});
