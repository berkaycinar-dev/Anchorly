import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../data/api/ApiError";
import { strings } from "../../strings";
import * as downloadModule from "../../utils/downloadJson";
import { renderWithAuth, VERIFIED_USER } from "../../test/renderWithAuth";
import DataSection from "./DataSection";

const t = strings.en;

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("DataSection", () => {
  it("downloads the exported data under a dated file name", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 4, 12));
    const user = userEvent.setup();
    const download = vi
      .spyOn(downloadModule, "default")
      .mockImplementation(() => {});
    const exportData = vi.fn().mockResolvedValue({ user: { id: "user-1" } });
    renderWithAuth(<DataSection t={t} />, { api: { exportData } });

    await user.click(screen.getByRole("button", { name: t.accountExport }));

    expect(download).toHaveBeenCalledWith(
      { user: { id: "user-1" } },
      "anchorly-export-2026-11-04.json",
    );
    expect(await screen.findByText(t.accountExported)).toBeInTheDocument();
  });

  it("disables the export until the email is verified", () => {
    const exportData = vi.fn();
    renderWithAuth(<DataSection t={t} />, {
      user: { ...VERIFIED_USER, emailVerifiedAt: null },
      api: { exportData },
    });

    expect(
      screen.getByRole("button", { name: t.accountExport }),
    ).toBeDisabled();
    expect(
      screen.getByText(t.accountExportNeedsVerification),
    ).toBeInTheDocument();
    expect(exportData).not.toHaveBeenCalled();
  });

  it("hides the verification note for verified users", () => {
    renderWithAuth(<DataSection t={t} />);

    expect(screen.queryByText(t.accountExportNeedsVerification)).toBeNull();
  });

  it("reports a failed export and downloads nothing", async () => {
    const user = userEvent.setup();
    const download = vi
      .spyOn(downloadModule, "default")
      .mockImplementation(() => {});
    const exportData = vi
      .fn()
      .mockRejectedValue(
        new ApiError({ status: 0, code: "NETWORK_ERROR", message: "x" }),
      );
    renderWithAuth(<DataSection t={t} />, { api: { exportData } });

    await user.click(screen.getByRole("button", { name: t.accountExport }));

    expect(await screen.findByText(t.authNetworkError)).toBeInTheDocument();
    expect(download).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: t.accountExport })).toBeEnabled();
  });
});
