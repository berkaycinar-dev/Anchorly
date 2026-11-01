import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderApp } from "./test/renderApp";

const TAB_WIDTH = 80;
const NAV_WIDTH = TAB_WIDTH * 5;
const LAYOUT_PROPERTIES = ["offsetLeft", "offsetWidth"];
const originalDescriptors = Object.fromEntries(
  LAYOUT_PROPERTIES.map((name) => [
    name,
    Object.getOwnPropertyDescriptor(HTMLElement.prototype, name),
  ]),
);

function tabIndexOf(element) {
  const item = element.closest(".bottom-nav-tabs > li");

  return item ? [...item.parentElement.children].indexOf(item) : 0;
}

function fakeLayout() {
  Object.defineProperty(HTMLElement.prototype, "offsetLeft", {
    configurable: true,
    get() {
      return tabIndexOf(this) * TAB_WIDTH;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get() {
      return this.classList.contains("bottom-nav") ? NAV_WIDTH : TAB_WIDTH;
    },
  });
}

function getBottomNav() {
  return screen.getByRole("navigation", { name: "Bottom menu" });
}

function getIndicator() {
  return getBottomNav().querySelector(".bottom-nav-indicator");
}

function expectIndicatorUnderTab(index) {
  const left = index * TAB_WIDTH + (TAB_WIDTH - 28) / 2;

  expect(getIndicator()).not.toHaveAttribute("hidden");
  expect(getIndicator().style.left).toBe(`${left}px`);
  expect(getIndicator().style.right).toBe(`${NAV_WIDTH - left - 28}px`);
}

beforeEach(() => {
  localStorage.setItem("language", JSON.stringify("en"));
  fakeLayout();
});

afterEach(() => {
  LAYOUT_PROPERTIES.forEach((name) =>
    Object.defineProperty(
      HTMLElement.prototype,
      name,
      originalDescriptors[name],
    ),
  );
});

describe("bottom navigation indicator", () => {
  it("is decorative and starts under the active tab without a direction", () => {
    renderApp("/today");

    expect(getIndicator()).toHaveAttribute("aria-hidden", "true");
    expectIndicatorUnderTab(1);
    expect(getIndicator()).not.toHaveAttribute("data-direction");
  });

  it("slides right and left with the active tab", async () => {
    const user = userEvent.setup();
    renderApp("/");

    expectIndicatorUnderTab(0);

    await user.click(
      within(getBottomNav()).getByRole("link", { name: /^Calendar/ }),
    );

    expectIndicatorUnderTab(3);
    expect(getIndicator()).toHaveAttribute("data-direction", "right");

    await user.click(
      within(getBottomNav()).getByRole("link", { name: /^Today/ }),
    );

    expectIndicatorUnderTab(1);
    expect(getIndicator()).toHaveAttribute("data-direction", "left");
  });

  it("moves under More while its panel is open and comes back when it closes", async () => {
    const user = userEvent.setup();
    renderApp("/today");

    const more = within(getBottomNav()).getByRole("button", { name: "More" });

    await user.click(more);

    expectIndicatorUnderTab(4);

    await user.click(more);

    expectIndicatorUnderTab(1);
  });

  it("stays under More on a page from the More panel", () => {
    renderApp("/archive");

    expectIndicatorUnderTab(4);
  });

  it("hides when the navigation is not rendered", () => {
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get() {
        return 0;
      },
    });

    renderApp("/");

    expect(getIndicator()).toHaveAttribute("hidden");
  });

  it("hides again when the navigation stops being rendered", async () => {
    const user = userEvent.setup();
    renderApp("/");

    expectIndicatorUnderTab(0);

    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get() {
        return 0;
      },
    });
    await user.click(
      within(getBottomNav()).getByRole("link", { name: /^Today/ }),
    );

    expect(getIndicator()).toHaveAttribute("hidden");
  });
});
