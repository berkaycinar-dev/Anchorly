import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { AuthContext } from "../../auth/AuthContext";
import { AUTH_STATUS } from "../../auth/authStatus";
import { strings } from "../../strings";
import GuestBanner from "./GuestBanner";

const t = strings.en;

beforeEach(() => {
  sessionStorage.clear();
});

function renderBanner(status = AUTH_STATUS.signedOut) {
  return render(
    <MemoryRouter useTransitions={false}>
      <AuthContext.Provider value={{ status, user: null }}>
        <GuestBanner t={t} />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("GuestBanner", () => {
  it("tells a guest the data stays on this device and offers an account", () => {
    renderBanner();

    expect(
      screen.getByRole("region", { name: t.guestBannerLabel }),
    ).toHaveTextContent(t.guestBannerTitle);
    expect(
      screen.getByRole("link", { name: t.guestBannerAction }),
    ).toHaveAttribute("href", "/register");
  });

  it.each([AUTH_STATUS.signedIn, AUTH_STATUS.loading, AUTH_STATUS.disabled])(
    "is hidden when the auth status is %s",
    (status) => {
      renderBanner(status);

      expect(screen.queryByRole("region")).toBeNull();
    },
  );

  it("hides after closing and stays hidden for the session", async () => {
    const user = userEvent.setup();
    const first = renderBanner();

    await user.click(screen.getByRole("button", { name: t.closeButton }));

    expect(screen.queryByRole("region")).toBeNull();

    first.unmount();
    renderBanner();

    expect(screen.queryByRole("region")).toBeNull();
  });

  it("shows again in a new session", () => {
    sessionStorage.setItem("anchorly.guestBannerDismissed", "true");
    sessionStorage.clear();

    renderBanner();

    expect(screen.getByRole("region")).toBeInTheDocument();
  });
});
