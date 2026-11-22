import { useId } from "react";
import { Link } from "react-router";
import Logo from "../components/Logo";
import formatLegalDate from "../components/legal/formatLegalDate";

const DOCUMENTS = {
  privacy: {
    titleKey: "legalPrivacyTitle",
    otherPath: "/terms",
    otherTitleKey: "legalTermsTitle",
  },
  terms: {
    titleKey: "legalTermsTitle",
    otherPath: "/privacy",
    otherTitleKey: "legalPrivacyTitle",
  },
};

function LegalBlock({ block }) {
  if (typeof block === "string") {
    return <p>{block}</p>;
  }

  return (
    <ul>
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function LegalPage({ t, language, documentKey }) {
  const titleId = useId();
  const documentInfo = DOCUMENTS[documentKey];
  const content = t.legalDocuments[documentKey];

  return (
    <main className="legal-page">
      <Link to="/" className="legal-brand">
        <Logo size={32} />
        <span className="legal-wordmark">Anchorly</span>
      </Link>

      <article className="legal-article" aria-labelledby={titleId}>
        <header className="legal-heading">
          <h1 id={titleId} className="legal-title">
            {t[documentInfo.titleKey]}
          </h1>
          <p className="legal-updated">
            {t.legalUpdated(formatLegalDate(language))}
          </p>
        </header>

        {content.intro.map((paragraph) => (
          <p key={paragraph} className="legal-intro">
            {paragraph}
          </p>
        ))}

        {content.sections.map((section) => (
          <section
            key={section.id}
            className="legal-section"
            aria-labelledby={`${titleId}-${section.id}`}
          >
            <h2 id={`${titleId}-${section.id}`} className="legal-section-title">
              {section.heading}
            </h2>
            {section.blocks.map((block, index) => (
              <LegalBlock key={index} block={block} />
            ))}
          </section>
        ))}
      </article>

      <nav className="legal-footer" aria-label={t.legalLinksLabel}>
        <Link to={documentInfo.otherPath}>{t[documentInfo.otherTitleKey]}</Link>
        <Link to="/">{t.legalBackToApp}</Link>
      </nav>
    </main>
  );
}

export default LegalPage;
