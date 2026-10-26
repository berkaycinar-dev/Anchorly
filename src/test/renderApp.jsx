import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import App from "../App";
import LocationProbe from "./LocationProbe";

export function renderApp(initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]} useTransitions={false}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  );
}

export function getCurrentPath() {
  return screen.getByTestId("location").textContent;
}
