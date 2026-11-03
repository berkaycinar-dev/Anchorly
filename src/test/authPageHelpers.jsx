import { render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi } from "vitest";
import { AuthContext } from "../auth/AuthContext";
import { AUTH_STATUS } from "../auth/authStatus";
import LocationProbe from "./LocationProbe";

export function renderAuthPage(
  element,
  { path = "/", status = AUTH_STATUS.signedOut, ...authValue } = {},
) {
  const value = {
    status,
    user: null,
    login: vi.fn(),
    register: vi.fn(),
    ...authValue,
  };

  const view = render(
    <MemoryRouter initialEntries={[path]} useTransitions={false}>
      <AuthContext.Provider value={value}>
        <Routes>
          <Route path={path.split("?")[0]} element={element} />
          <Route path="*" element={null} />
        </Routes>
      </AuthContext.Provider>
      <LocationProbe />
    </MemoryRouter>,
  );

  return { ...view, auth: value };
}
