import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { AuthContext } from "../auth/AuthContext";
import { AUTH_STATUS } from "../auth/authStatus";
import { strings } from "../strings";
import SettingsPage from "./SettingsPage";

const t = strings.en;

function renderSettings() {
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
});
