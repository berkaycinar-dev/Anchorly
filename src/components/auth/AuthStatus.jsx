import Icon from "../Icon";

function AuthStatus({
  icon,
  tone = "info",
  spinning = false,
  title,
  children,
  actions,
}) {
  return (
    <div className="auth-status">
      <span
        className="auth-status-icon"
        data-tone={tone}
        data-spinning={spinning || undefined}
      >
        <Icon icon={icon} size="lg" />
      </span>
      <h1 className="auth-title">{title}</h1>
      <p className="auth-subtitle">{children}</p>
      {actions ? <div className="auth-status-actions">{actions}</div> : null}
    </div>
  );
}

export default AuthStatus;
