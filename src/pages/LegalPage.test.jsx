import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LEGAL_CONTACT_EMAIL } from "../constants/legal";
import { strings } from "../strings";
import LegalPage from "./LegalPage";

function renderLegal(documentKey, language = "en") {
  return render(
    <MemoryRouter useTransitions={false}>
      <LegalPage
        t={strings[language]}
        language={language}
        documentKey={documentKey}
      />
    </MemoryRouter>,
  );
}

function sectionIds(language, documentKey) {
  return strings[language].legalDocuments[documentKey].sections.map(
    (section) => section.id,
  );
}

describe("LegalPage", () => {
  it("renders the privacy notice with its date, sections and contact address", () => {
    const t = strings.en;
    renderLegal("privacy");

    expect(
      screen.getByRole("heading", { level: 1, name: t.legalPrivacyTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Last updated: 22 November 2026"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
      t.legalDocuments.privacy.sections.length,
    );
    expect(
      screen.getAllByText(new RegExp(LEGAL_CONTACT_EMAIL)).length,
    ).toBeGreaterThan(0);
  });

  it("renders the terms in Turkish with a Turkish date", () => {
    const t = strings.tr;
    renderLegal("terms", "tr");

    expect(
      screen.getByRole("heading", { level: 1, name: t.legalTermsTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Son güncelleme: 22 Kasım 2026"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "1. Hizmet" }),
    ).toBeInTheDocument();
  });

  it("links to the other document and back to the app", () => {
    const t = strings.en;
    renderLegal("privacy");
    const footer = screen.getByRole("navigation", { name: t.legalLinksLabel });

    expect(
      within(footer).getByRole("link", { name: t.legalTermsTitle }),
    ).toHaveAttribute("href", "/terms");
    expect(
      within(footer).getByRole("link", { name: t.legalBackToApp }),
    ).toHaveAttribute("href", "/");
  });

  it("points the terms page at the privacy notice", () => {
    const t = strings.en;
    renderLegal("terms");
    const footer = screen.getByRole("navigation", { name: t.legalLinksLabel });

    expect(
      within(footer).getByRole("link", { name: t.legalPrivacyTitle }),
    ).toHaveAttribute("href", "/privacy");
  });

  it("renders lists as list items", () => {
    renderLegal("privacy");
    const rights = screen.getByRole("region", {
      name: "9. Your rights under the KVKK",
    });

    expect(within(rights).getAllByRole("listitem")).toHaveLength(8);
  });

  it("keeps the Turkish and English documents in the same shape", () => {
    for (const documentKey of ["privacy", "terms"]) {
      expect(sectionIds("tr", documentKey)).toEqual(
        sectionIds("en", documentKey),
      );

      const shapes = ["tr", "en"].map((language) =>
        strings[language].legalDocuments[documentKey].sections.map((section) =>
          section.blocks.map((block) =>
            typeof block === "string" ? "p" : block.items.length,
          ),
        ),
      );

      expect(shapes[0]).toEqual(shapes[1]);
    }
  });

  it("names every service provider in both languages", () => {
    for (const language of ["tr", "en"]) {
      const text = JSON.stringify(strings[language].legalDocuments.privacy);

      for (const provider of ["Vercel", "Render", "Neon", "Resend"]) {
        expect(text, `${language} ${provider}`).toContain(provider);
      }
    }
  });
});
