import { useCallback, useState } from "react";
import describeAuthError from "./authErrors";
import useAuth from "./useAuth";
import useCountdown from "./useCountdown";

export const RESEND_VERIFICATION_DELAY_SECONDS = 60;

export default function useResendVerification(t) {
  const { api, setUser } = useAuth();
  const [sending, setSending] = useState(false);
  const [remaining, startCountdown] = useCountdown();

  const resend = useCallback(async () => {
    setSending(true);

    try {
      await api.resendVerification();
      startCountdown(RESEND_VERIFICATION_DELAY_SECONDS);
      return { status: "sent" };
    } catch (error) {
      if (error?.code === "EMAIL_ALREADY_VERIFIED") {
        try {
          setUser(await api.getMe());
        } catch {
          return { status: "already-verified" };
        }

        return { status: "already-verified" };
      }

      const described = describeAuthError(error, t);

      if (described.retryAfterSeconds > 0) {
        startCountdown(described.retryAfterSeconds);
      }

      return { status: "failed", message: described.alert.message };
    } finally {
      setSending(false);
    }
  }, [api, setUser, startCountdown, t]);

  return { resend, sending, remaining };
}
