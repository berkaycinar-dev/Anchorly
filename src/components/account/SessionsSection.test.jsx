import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../../data/api/ApiError";
import { strings } from "../../strings";
import { renderWithAuth } from "../../test/renderWithAuth";
import SessionsSection from "./SessionsSection";

const t = strings.en;

const SESSIONS = [
  {
    id: "s1",
    deviceName: "Chrome · Windows",
    lastUsedAt: "2026-11-04T10:00:00.000Z",
    current: true,
  },
  {
    id: "s2",
    deviceName: "Safari · iOS",
    lastUsedAt: "2026-11-03T08:00:00.000Z",
    current: false,
  },
  {
    id: "s3",
    deviceName: null,
    lastUsedAt: "2026-11-02T08:00:00.000Z",
    current: false,
  },
];

function renderSessions(api) {
  return renderWithAuth(
    <SessionsSection t={t} language="en" refreshKey={0} />,
    {
      api,
    },
  );
}

describe("SessionsSection", () => {
  it("lists sessions with the current one marked and unknown devices named", async () => {
    renderSessions({ listSessions: vi.fn().mockResolvedValue(SESSIONS) });

    expect(screen.getByRole("status")).toHaveTextContent(
      t.accountSessionsLoading,
    );
    expect(await screen.findByText("Chrome · Windows")).toBeInTheDocument();
    expect(screen.getByText(t.accountCurrentDevice)).toBeInTheDocument();
    expect(screen.getByText(t.accountUnknownDevice)).toBeInTheDocument();
    expect(screen.getAllByText(/Last used:/)).toHaveLength(3);
    expect(
      screen.queryByRole("button", {
        name: t.accountSignOutSessionLabel("Chrome · Windows"),
      }),
    ).toBeNull();
  });

  it("ends one session", async () => {
    const user = userEvent.setup();
    const revokeSession = vi.fn().mockResolvedValue(undefined);
    renderSessions({
      listSessions: vi.fn().mockResolvedValue(SESSIONS),
      revokeSession,
    });

    await user.click(
      await screen.findByRole("button", {
        name: t.accountSignOutSessionLabel("Safari · iOS"),
      }),
    );

    expect(revokeSession).toHaveBeenCalledWith("s2");
    await waitFor(() => {
      expect(screen.queryByText("Safari · iOS")).toBeNull();
    });
    expect(screen.getByText(t.accountSessionRevoked)).toBeInTheDocument();
  });

  it("ends all other sessions and hides the button afterwards", async () => {
    const user = userEvent.setup();
    const revokeOtherSessions = vi.fn().mockResolvedValue(undefined);
    renderSessions({
      listSessions: vi.fn().mockResolvedValue(SESSIONS),
      revokeOtherSessions,
    });

    await user.click(
      await screen.findByRole("button", { name: t.accountSignOutOthers }),
    );

    expect(revokeOtherSessions).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: t.accountSignOutOthers }),
      ).toBeNull();
    });
    expect(screen.getByText("Chrome · Windows")).toBeInTheDocument();
    expect(screen.queryByText("Safari · iOS")).toBeNull();
  });

  it("offers no bulk sign out when this is the only session", async () => {
    renderSessions({ listSessions: vi.fn().mockResolvedValue([SESSIONS[0]]) });

    await screen.findByText("Chrome · Windows");
    expect(
      screen.queryByRole("button", { name: t.accountSignOutOthers }),
    ).toBeNull();
  });

  it("keeps the list and explains when ending a session fails", async () => {
    const user = userEvent.setup();
    renderSessions({
      listSessions: vi.fn().mockResolvedValue(SESSIONS),
      revokeSession: vi
        .fn()
        .mockRejectedValue(
          new ApiError({ status: 0, code: "NETWORK_ERROR", message: "x" }),
        ),
    });

    await user.click(
      await screen.findByRole("button", {
        name: t.accountSignOutSessionLabel("Safari · iOS"),
      }),
    );

    expect(await screen.findByText(t.authNetworkError)).toBeInTheDocument();
    expect(screen.getByText("Safari · iOS")).toBeInTheDocument();
  });

  it("shows an error with a retry when loading fails", async () => {
    const user = userEvent.setup();
    const listSessions = vi
      .fn()
      .mockRejectedValueOnce(
        new ApiError({ status: 0, code: "NETWORK_ERROR", message: "x" }),
      )
      .mockResolvedValueOnce(SESSIONS);
    renderSessions({ listSessions });

    expect(
      await screen.findByText(t.accountSessionsLoadError),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t.accountRetry }));

    expect(await screen.findByText("Chrome · Windows")).toBeInTheDocument();
    expect(listSessions).toHaveBeenCalledTimes(2);
  });

  it("reloads when the refresh key changes", async () => {
    const user = userEvent.setup();
    const listSessions = vi.fn().mockResolvedValue(SESSIONS);

    function Harness() {
      const [key, setKey] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setKey((value) => value + 1)}>
            bump
          </button>
          <SessionsSection t={t} language="en" refreshKey={key} />
        </>
      );
    }

    renderWithAuth(<Harness />, { api: { listSessions } });
    await screen.findByText("Chrome · Windows");
    expect(listSessions).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "bump" }));

    await waitFor(() => {
      expect(listSessions).toHaveBeenCalledTimes(2);
    });
  });
});
