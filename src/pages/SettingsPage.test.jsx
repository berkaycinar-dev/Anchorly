import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "../auth/AuthContext";
import { AUTH_STATUS } from "../auth/authStatus";
import { strings } from "../strings";
import SettingsPage from "./SettingsPage";

const t = strings.en;

function fakeInstallStore(status, install = vi.fn(async () => "accepted")) {
  return { getStatus: () => status, subscribe: () => () => {}, install };
}

function renderSettings({ installPromptStore } = {}) {
  return render(
    <MemoryRouter useTransitions={false}>
      <AuthContext.Provider
        value={{ status: AUTH_STATUS.signedOut, user: null }}
      >
        <SettingsPage
          t={t}
          theme="gray"
          setTheme={vi.fn()}
          language="en"
          setLanguage={vi.fn()}
          fontFamily="Inter"
          setFontFamily={vi.fn()}
          weekStartDay="monday"
          setWeekStartDay={vi.fn()}
          installPromptStore={installPromptStore}
        />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("SettingsPage", () => {
  it("links to the privacy notice and the terms under About", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(
      screen.getByRole("button", { name: t.settingsCategoryAbout }),
    );

    expect(
      screen.getByRole("heading", { level: 3, name: t.settingsCategoryAbout }),
    ).toBeInTheDocument();
    expect(screen.getByText(t.settingsPrivacyDescription)).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: `${t.settingsOpenDocument}: ${t.legalPrivacyTitle}`,
      }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", {
        name: `${t.settingsOpenDocument}: ${t.legalTermsTitle}`,
      }),
    ).toHaveAttribute("href", "/terms");
  });

  it("installs the app from About when the browser offers it", async () => {
    const user = userEvent.setup();
    const install = vi.fn(async () => "accepted");
    renderSettings({
      installPromptStore: fakeInstallStore("available", install),
    });

    await user.click(
      screen.getByRole("button", { name: t.settingsCategoryAbout }),
    );

    expect(screen.getByText(t.settingsInstallTitle)).toBeInTheDocument();
    expect(screen.getByText(t.settingsInstallDescription)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: t.settingsInstallButton }),
    );
    expect(install).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["installed", t.settingsInstallInstalled],
    ["ios", t.settingsInstallIos],
    ["unavailable", t.settingsInstallUnavailable],
  ])("explains instead of showing a button when %s", async (status, text) => {
    const user = userEvent.setup();
    renderSettings({ installPromptStore: fakeInstallStore(status) });

    await user.click(
      screen.getByRole("button", { name: t.settingsCategoryAbout }),
    );

    expect(screen.getByText(text)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: t.settingsInstallButton }),
    ).not.toBeInTheDocument();
  });
});
