import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { strings } from "../../strings";
import AuthLayout from "./AuthLayout";

const t = strings.en;

function renderLayout(props) {
  return render(
    <MemoryRouter useTransitions={false}>
      <AuthLayout t={t} {...props}>
        <p>Body</p>
      </AuthLayout>
    </MemoryRouter>,
  );
}

describe("AuthLayout", () => {
  it("renders the brand, a heading, the body and the guest link", () => {
    renderLayout({ title: "Sign in", subtitle: "Welcome back" });

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText("Anchorly")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: t.authContinueAsGuest }),
    ).toHaveAttribute("href", "/");
  });

  it("omits the heading block when there is no title", () => {
    renderLayout({});

    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("renders the footer inside the card", () => {
    renderLayout({ title: "Sign in", footer: <a href="/register">Go</a> });

    expect(
      screen.getByRole("link", { name: "Go" }).closest(".ui-card"),
    ).not.toBeNull();
  });

  it("links to the privacy notice and the terms", () => {
    renderLayout({ title: "Sign in" });
    const links = screen.getByRole("navigation", { name: t.legalLinksLabel });

    expect(
      within(links).getByRole("link", { name: t.legalPrivacyLink }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      within(links).getByRole("link", { name: t.legalTermsLink }),
    ).toHaveAttribute("href", "/terms");
  });
});
