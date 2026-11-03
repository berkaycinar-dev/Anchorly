import { Link } from "react-router";
import Alert from "../ui/Alert";

function AuthAlert({ t, alert, signInPath }) {
  if (!alert) {
    return null;
  }

  const actions = alert.offerSignIn ? (
    <Link to={signInPath}>{t.signIn}</Link>
  ) : undefined;

  return (
    <Alert tone={alert.tone} actions={actions}>
      {alert.message}
    </Alert>
  );
}

export default AuthAlert;
