import { useState } from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import TimeField from "./TimeField";
import { strings } from "../strings";

const t = strings.en;

function Harness({ initial = "" }) {
  const [value, setValue] = useState(initial);

  return (
    <>
      <TimeField
        id="time"
        value={value}
        onChange={setValue}
        ariaLabel="Time"
        t={t}
      />
      <output data-testid="value">{value}</output>
    </>
  );
}

function getValue() {
  return screen.getByTestId("value").textContent;
}

describe("TimeField", () => {
  it("shows a placeholder, or the chosen time", () => {
    const { rerender } = render(
      <TimeField value="" onChange={() => {}} ariaLabel="Time" t={t} />,
    );

    expect(screen.getByRole("button", { name: "Time" })).toHaveTextContent(
      "--:--",
    );

    rerender(
      <TimeField value="14:05" onChange={() => {}} ariaLabel="Time" t={t} />,
    );

    expect(screen.getByRole("button", { name: "Time" })).toHaveTextContent(
      "14:05",
    );
  });

  it("opens a picker and sets hour and minute", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Time" }));

    const hours = screen.getByRole("listbox", { name: "Hours" });
    const minutes = screen.getByRole("listbox", { name: "Minutes" });

    await user.click(within(hours).getByRole("option", { name: "16" }));

    expect(getValue()).toBe("16:00");

    await user.click(within(minutes).getByRole("option", { name: "45" }));

    expect(getValue()).toBe("16:45");
    expect(within(hours).getByRole("option", { name: "16" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("uses a default hour when only the minute is picked", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Time" }));
    await user.click(screen.getByRole("option", { name: "30" }));

    expect(getValue()).toBe("09:30");
  });

  it("closes with Done and gives focus back to the trigger", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Time" }));
    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByRole("button", { name: "Time" })).toHaveFocus();
  });

  it("closes on Escape without reaching parent key handlers", async () => {
    const user = userEvent.setup();
    let parentSawEscape = false;

    render(
      <div
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            parentSawEscape = true;
          }
        }}
      >
        <Harness />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Time" }));
    await user.click(
      within(screen.getByRole("listbox", { name: "Hours" })).getByRole(
        "option",
        { name: "10" },
      ),
    );
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(parentSawEscape).toBe(false);
  });

  it("closes when pressing outside", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Elsewhere</button>
        <Harness />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Time" }));
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));

    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("picks the number the wheel settles on when scrolled", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Time" }));

    const hours = screen.getByRole("listbox", { name: "Hours" });
    const minutes = screen.getByRole("listbox", { name: "Minutes" });

    hours.scrollTop = 40 * 17;
    fireEvent.scroll(hours);
    minutes.scrollTop = 40 * 42;
    fireEvent.scroll(minutes);

    await waitFor(() => expect(getValue()).toBe("17:42"));
  });

  it("commits the centred default time when Done is pressed on an empty field", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Time" }));
    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(getValue()).toBe("09:00");
  });

  it("loops the wheel from 23 back to 00 and from 00 to 59", async () => {
    const user = userEvent.setup();
    render(<Harness initial="23:00" />);

    await user.click(screen.getByRole("button", { name: "Time" }));

    const hours = screen.getByRole("listbox", { name: "Hours" });
    const minutes = screen.getByRole("listbox", { name: "Minutes" });

    // Scrolled one step past 23 lands on 00 of the next copy.
    hours.scrollTop = 40 * (24 + 24);
    fireEvent.scroll(hours);
    // One step before 00 of the first copy is 59 of the previous copy.
    minutes.scrollTop = 40 * 59;
    fireEvent.scroll(minutes);

    await waitFor(() => expect(getValue()).toBe("00:59"));
    expect(hours.scrollTop).toBe(40 * 24);
  });
});
