import { Link } from "react-router";

function LegalLinks({ t, className = "legal-links" }) {
  return (
    <nav className={className} aria-label={t.legalLinksLabel}>
      <Link to="/privacy">{t.legalPrivacyLink}</Link>
      <Link to="/terms">{t.legalTermsLink}</Link>
    </nav>
  );
}

export default LegalLinks;
