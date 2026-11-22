import useAuth from "../../auth/useAuth";
import { AUTH_STATUS } from "../../auth/authStatus";

export default function useTermsPending() {
  const { status, user } = useAuth();

  return status === AUTH_STATUS.signedIn && user?.termsAccepted === false;
}
