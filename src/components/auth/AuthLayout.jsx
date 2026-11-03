import { Link } from "react-router";
import Logo from "../Logo";
import Card from "../ui/Card";

function AuthLayout({ t, title, subtitle, footer, children }) {
  return (
    <main className="auth-page">
      <div className="auth-brand">
        <Logo size={48} />
        <span className="auth-wordmark">Anchorly</span>
      </div>
      <Card className="auth-card">
        {title ? (
          <div className="auth-heading">
            <h1 className="auth-title">{title}</h1>
            {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
          </div>
        ) : null}
        {children}
        {footer ? <p className="auth-switch">{footer}</p> : null}
      </Card>
      <Link to="/" className="auth-guest-link">
        {t.authContinueAsGuest}
      </Link>
    </main>
  );
}

export default AuthLayout;
