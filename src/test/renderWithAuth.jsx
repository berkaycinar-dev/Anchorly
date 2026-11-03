import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi } from "vitest";
import { AuthContext } from "../auth/AuthContext";
import { AUTH_STATUS } from "../auth/authStatus";
import ToastProvider from "../components/toast/ToastProvider";
import LocationProbe from "./LocationProbe";

export const VERIFIED_USER = {
  id: "user-1",
  email: "dev@anchorly.local",
  displayName: "Dev",
  emailVerifiedAt: "2026-11-01T00:00:00.000Z",
};

export function renderWithAuth(
  element,
  {
    path = "/account",
    status = AUTH_STATUS.signedIn,
    user = VERIFIED_USER,
    api = {},
    setUser = vi.fn(),
    endSession = vi.fn(),
  } = {},
) {
  const value = { status, user, api, setUser, endSession };

  const view = render(
    <MemoryRouter initialEntries={[path]} useTransitions={false}>
      <ToastProvider closeLabel="Close">
        <AuthContext.Provider value={value}>
          <Routes>
            <Route path="/account" element={element} />
            <Route path="*" element={null} />
          </Routes>
        </AuthContext.Provider>
      </ToastProvider>
      <LocationProbe />
    </MemoryRouter>,
  );

  return { ...view, setUser, endSession };
}
