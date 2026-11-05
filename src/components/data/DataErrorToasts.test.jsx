import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ApiError, NETWORK_ERROR } from "../../data/api/ApiError";
import { reportDataError } from "../../data/api/dataErrorStatus";
import { strings } from "../../strings";
import ToastProvider from "../toast/ToastProvider";
import DataErrorToasts from "./DataErrorToasts";

const t = strings.en;

function renderToasts() {
  return render(
    <ToastProvider closeLabel={t.closeButton}>
      <DataErrorToasts t={t} />
    </ToastProvider>,
  );
}

describe("DataErrorToasts", () => {
  it("shows nothing when no error has been reported", () => {
    renderToasts();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("ignores errors that were reported before it mounted", () => {
    reportDataError(new Error("old"));

    renderToasts();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the network message for an unreachable server", () => {
    renderToasts();

    act(() => {
      reportDataError(
        new ApiError({ status: 0, code: NETWORK_ERROR, message: "x" }),
      );
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      t.dataSaveFailedNetwork,
    );
  });

  it("shows the generic message for other failures", () => {
    renderToasts();

    act(() => {
      reportDataError(new Error("boom"));
    });

    expect(screen.getByRole("alert")).toHaveTextContent(t.dataSaveFailedOther);
  });

  it("shows nothing for an expired session", () => {
    renderToasts();

    act(() => {
      reportDataError(
        new ApiError({ status: 401, code: "UNAUTHORIZED", message: "x" }),
      );
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
