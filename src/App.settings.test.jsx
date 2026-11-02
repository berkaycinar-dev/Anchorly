import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, it, expect, vi } from "vitest";
import { setSessionHint } from "./data/local/sessionHint";
import { renderApp } from "./test/renderApp";

function getAppRoot() {
  return document.querySelector(".app");
}

function jsonResponse(status, body) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const SESSION = {
  user: { id: "user-1", email: "dev@anchorly.local", displayName: "Dev User" },
  accessToken: "token-1",
  accessTokenExpiresIn: 900,
  refreshTokenExpiresAt: "2026-12-01T00:00:00.000Z",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("App settings", () => {
  it("opens with the default theme, font and language", () => {
    renderApp("/settings");

    expect(getAppRoot()).toHaveClass("theme-gray");
    expect(getAppRoot().style.getPropertyValue("--font-main")).toContain(
      "Inter",
    );
    expect(document.querySelector(".page-title")).toHaveTextContent("Ayarlar");
  });

  it("opens on the appearance category without an account category", () => {
    renderApp("/settings");

    const nav = screen.getByRole("navigation", { name: "Ayar kategorileri" });

    expect(
      within(nav).getByRole("button", { name: "Görünüm" }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      within(nav).getByRole("button", { name: "Dil ve bölge" }),
    ).not.toHaveAttribute("aria-current");
    expect(within(nav).queryByRole("button", { name: "Hesap" })).toBeNull();
  });

  it("applies and saves a new theme", async () => {
    const user = userEvent.setup();
    renderApp("/settings");

    await user.click(screen.getByRole("button", { name: "Yeşil" }));

    expect(getAppRoot()).toHaveClass("theme-green");
    expect(localStorage.getItem("theme")).toBe('"green"');
  });

  it("applies and saves the black theme", async () => {
    const user = userEvent.setup();
    renderApp("/settings");

    await user.click(screen.getByRole("button", { name: "Siyah" }));

    expect(getAppRoot()).toHaveClass("theme-black");
    expect(localStorage.getItem("theme")).toBe('"black"');
  });

  it("marks only the chosen theme as pressed", async () => {
    const user = userEvent.setup();
    renderApp("/settings");

    expect(screen.getByRole("button", { name: "Gri" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Mavi" }));

    expect(screen.getByRole("button", { name: "Mavi" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Gri" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("switches the interface to English and saves the language", async () => {
    const user = userEvent.setup();
    renderApp("/settings");

    await user.click(screen.getByRole("button", { name: "Dil ve bölge" }));
    await user.click(screen.getByRole("button", { name: "English" }));

    expect(document.querySelector(".page-title")).toHaveTextContent("Settings");
    expect(localStorage.getItem("language")).toBe('"en"');
  });

  it("applies and saves a new font and week start", async () => {
    const user = userEvent.setup();
    renderApp("/settings");

    await user.click(screen.getByRole("button", { name: "Poppins" }));
    await user.click(screen.getByRole("button", { name: "Dil ve bölge" }));
    await user.click(screen.getByRole("button", { name: "Pazar" }));

    expect(getAppRoot().style.getPropertyValue("--font-main")).toContain(
      "Poppins",
    );
    expect(localStorage.getItem("fontFamily")).toBe('"Poppins"');
    expect(localStorage.getItem("weekStartDay")).toBe('"sunday"');
  });

  it("shows only the settings of the chosen category", async () => {
    const user = userEvent.setup();
    renderApp("/settings");

    expect(screen.getByRole("button", { name: "Poppins" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pazar" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Dil ve bölge" }));

    expect(screen.getByRole("button", { name: "Pazar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Poppins" })).toBeNull();
  });

  it("keeps the chosen settings after the app opens again", async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp("/settings");
    await user.click(screen.getByRole("button", { name: "Pembe" }));
    await user.click(screen.getByRole("button", { name: "Dil ve bölge" }));
    await user.click(screen.getByRole("button", { name: "English" }));
    unmount();

    renderApp("/settings");

    expect(getAppRoot()).toHaveClass("theme-pink");
    expect(document.querySelector(".page-title")).toHaveTextContent("Settings");
  });
});

describe("App settings account category", () => {
  it("shows the signed-in user and returns to appearance after signing out", async () => {
    vi.stubEnv("VITE_AUTH_ENABLED", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) =>
        url === "/api/auth/refresh"
          ? jsonResponse(200, SESSION)
          : jsonResponse(204),
      ),
    );
    setSessionHint();
    const user = userEvent.setup();

    renderApp("/settings");

    const nav = screen.getByRole("navigation", { name: "Ayar kategorileri" });

    await user.click(await within(nav).findByRole("button", { name: "Hesap" }));

    const panel = screen.getByRole("region", { name: "Hesap" });

    expect(within(panel).getByText("Dev User")).toBeInTheDocument();
    expect(within(panel).getByText("dev@anchorly.local")).toBeInTheDocument();
    expect(
      within(panel).getByRole("link", { name: "Hesabı yönet" }),
    ).toHaveAttribute("href", "/account");

    await user.click(within(panel).getByRole("button", { name: "Çıkış yap" }));

    await waitFor(() => {
      expect(within(nav).queryByRole("button", { name: "Hesap" })).toBeNull();
    });
    expect(screen.getByRole("region", { name: "Görünüm" })).toBeInTheDocument();
  });
});
