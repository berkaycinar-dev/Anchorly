import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "../auth/AuthContext";
import { AUTH_STATUS } from "../auth/authStatus";
import { strings } from "../strings";
import ToastProvider from "./toast/ToastProvider";
import SidebarAccount from "./SidebarAccount";
import LocationProbe from "../test/LocationProbe";

const t = strings.en;
const USER = {
  id: "user-1",
  email: "berkay@anchorly.dev",
  displayName: "Berkay Çınar",
};

function renderAccount({
  status = AUTH_STATUS.signedIn,
  user = USER,
  logout = vi.fn(async () => ({ serverSignedOut: true, error: null })),
  isExpanded = true,
  onNavigate = vi.fn(),
} = {}) {
  const view = render(
    <MemoryRouter initialEntries={["/today"]} useTransitions={false}>
      <ToastProvider closeLabel="Close">
        <AuthContext.Provider value={{ status, user, logout }}>
          <button type="button">Outside</button>
          <SidebarAccount
            t={t}
            isExpanded={isExpanded}
            onNavigate={onNavigate}
          />
        </AuthContext.Provider>
      </ToastProvider>
      <LocationProbe />
    </MemoryRouter>,
  );

  return { ...view, logout, onNavigate };
}

function getTrigger() {
  return screen.getByRole("button", { name: /account menu$/ });
}

describe("SidebarAccount", () => {
  it("renders nothing while authentication is disabled", () => {
    const { container } = renderAccount({
      status: AUTH_STATUS.disabled,
      user: null,
    });

    expect(container.querySelector(".sidebar-account")).toBeNull();
  });

  it("shows a busy placeholder while the session loads", () => {
    renderAccount({ status: AUTH_STATUS.loading, user: null });

    const placeholder = screen.getByRole("status", { name: "Loading account" });

    expect(placeholder).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("offers sign in and sign up when signed out", async () => {
    const user = userEvent.setup();
    const { onNavigate } = renderAccount({
      status: AUTH_STATUS.signedOut,
      user: null,
    });

    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/register",
    );

    await user.click(screen.getByRole("link", { name: "Sign in" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("shows a sign in tooltip only when collapsed", () => {
    const { unmount } = renderAccount({
      status: AUTH_STATUS.signedOut,
      user: null,
    });

    expect(document.querySelector(".nav-tooltip")).toBeNull();
    unmount();

    renderAccount({
      status: AUTH_STATUS.signedOut,
      user: null,
      isExpanded: false,
    });

    expect(document.querySelector(".nav-tooltip")).toHaveTextContent("Sign in");
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows the name, email and initials of the signed in user", () => {
    renderAccount();

    const trigger = getTrigger();

    expect(trigger).toHaveAccessibleName("Berkay Çınar, account menu");
    expect(trigger).toHaveTextContent("BÇ");
    expect(trigger).toHaveTextContent("berkay@anchorly.dev");
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("derives the name from the email without a display name", () => {
    renderAccount({ user: { ...USER, displayName: null } });

    expect(getTrigger()).toHaveAccessibleName("berkay, account menu");
    expect(getTrigger()).toHaveTextContent("BE");
  });

  it("shows a name tooltip only when collapsed and closed", async () => {
    const user = userEvent.setup();
    renderAccount({ isExpanded: false });

    expect(document.querySelector(".nav-tooltip")).toHaveTextContent(
      "Berkay Çınar · account",
    );
    expect(document.querySelector(".nav-tooltip")).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    await user.click(getTrigger());

    expect(document.querySelector(".nav-tooltip")).toBeNull();
  });

  it("opens a menu with account, settings and sign out", async () => {
    const user = userEvent.setup();
    renderAccount();

    await user.click(getTrigger());

    const menu = screen.getByRole("menu", { name: "account menu" });
    const items = screen.getAllByRole("menuitem");

    expect(getTrigger()).toHaveAttribute("aria-expanded", "true");
    expect(getTrigger()).toHaveAttribute(
      "aria-controls",
      menu.parentElement.id,
    );
    expect(menu).toHaveTextContent("berkay@anchorly.dev");
    expect(items.map((item) => item.textContent)).toEqual([
      "Account",
      "Settings",
      "Sign out",
    ]);
    expect(items[0]).toHaveAttribute("href", "/account");
    expect(items[1]).toHaveAttribute("href", "/settings");
    expect(items[0]).toHaveFocus();
  });

  it("moves through the items with the arrow, Home and End keys", async () => {
    const user = userEvent.setup();
    renderAccount();

    await user.click(getTrigger());
    const items = screen.getAllByRole("menuitem");

    await user.keyboard("{ArrowDown}");
    expect(items[1]).toHaveFocus();

    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(items[0]).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(items[2]).toHaveFocus();

    await user.keyboard("{Home}");
    expect(items[0]).toHaveFocus();

    await user.keyboard("{End}");
    expect(items[2]).toHaveFocus();
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderAccount();

    await user.click(getTrigger());
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).toBeNull();
    expect(getTrigger()).toHaveFocus();
    expect(getTrigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps Escape from reaching other listeners while open", async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    window.addEventListener("keydown", outer);
    renderAccount();

    await user.click(getTrigger());
    await user.keyboard("{Escape}");
    window.removeEventListener("keydown", outer);

    expect(outer).not.toHaveBeenCalledWith(
      expect.objectContaining({ key: "Escape" }),
    );
  });

  it("closes when clicking outside", async () => {
    const user = userEvent.setup();
    renderAccount();

    await user.click(getTrigger());
    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes when the trigger is clicked again", async () => {
    const user = userEvent.setup();
    renderAccount();

    await user.click(getTrigger());
    await user.click(getTrigger());

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes when tabbing out of the menu", async () => {
    const user = userEvent.setup();
    renderAccount();

    await user.click(getTrigger());
    await user.keyboard("{Tab}");

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("navigates and closes when a link is chosen", async () => {
    const user = userEvent.setup();
    const { onNavigate } = renderAccount();

    await user.click(getTrigger());
    await user.click(screen.getByRole("menuitem", { name: "Settings" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/settings");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("signs out without a warning when the server answers", async () => {
    const user = userEvent.setup();
    const { logout, onNavigate } = renderAccount();

    await user.click(getTrigger());
    await user.click(screen.getByRole("menuitem", { name: "Sign out" }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.queryByText(t.signedOutLocally)).toBeNull();
  });

  it("warns when the sign out only happened on this device", async () => {
    const user = userEvent.setup();
    renderAccount({
      logout: vi.fn(async () => ({
        serverSignedOut: false,
        error: new Error("offline"),
      })),
    });

    await user.click(getTrigger());
    await user.click(screen.getByRole("menuitem", { name: "Sign out" }));

    expect(await screen.findByText(t.signedOutLocally)).toBeInTheDocument();
  });

  it("stops listening for outside clicks after closing", async () => {
    const user = userEvent.setup();
    const removeSpy = vi.spyOn(document, "removeEventListener");
    renderAccount();

    await user.click(getTrigger());
    await act(async () => {
      await user.keyboard("{Escape}");
    });

    await waitFor(() =>
      expect(removeSpy).toHaveBeenCalledWith(
        "pointerdown",
        expect.any(Function),
      ),
    );
  });
});
