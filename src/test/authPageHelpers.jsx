import { render } from "@testing-library/react";
import { Fragment, StrictMode } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi } from "vitest";
import { AuthContext } from "../auth/AuthContext";
import { AUTH_STATUS } from "../auth/authStatus";
import LocationProbe from "./LocationProbe";

export function renderAuthPage(
  element,
  {
    path = "/",
    state,
    strict = false,
    status = AUTH_STATUS.signedOut,
    ...authValue
  } = {},
) {
  const value = {
    status,
    user: null,
    login: vi.fn(),
    register: vi.fn(),
    ...authValue,
  };

  const url = new URL(path, "http://localhost");

  const Wrapper = strict ? StrictMode : Fragment;

  const view = render(
    <Wrapper>
      <MemoryRouter
        initialEntries={[
          { pathname: url.pathname, search: url.search, hash: url.hash, state },
        ]}
        useTransitions={false}
      >
        <AuthContext.Provider value={value}>
          <Routes>
            <Route path={path.split(/[?#]/)[0]} element={element} />
            <Route path="*" element={null} />
          </Routes>
        </AuthContext.Provider>
        <LocationProbe />
      </MemoryRouter>
    </Wrapper>,
  );

  return { ...view, auth: value };
}
