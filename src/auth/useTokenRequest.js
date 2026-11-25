import { useEffect, useRef, useState } from "react";
import describeAuthError from "./authErrors";
import useHashToken from "./useHashToken";

// Sends the link token from the URL once per attempt. `state.kind` is
// "loading", "success", "invalid", "failed" (with `message`) or whatever
// `classifyError` returns for errors it recognises.
export default function useTokenRequest({ request, classifyError, t }) {
  const [token] = useHashToken();
  const [state, setState] = useState(
    token === "" ? { kind: "invalid" } : { kind: "loading" },
  );
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const startedAttemptRef = useRef(-1);

  useEffect(() => {
    if (token === "" || startedAttemptRef.current === attempt) {
      return;
    }

    startedAttemptRef.current = attempt;

    request(token).then(
      (value) => {
        setResult(value);
        setState({ kind: "success" });
      },
      (error) => {
        const custom = classifyError?.(error);

        if (custom) {
          setState({ kind: custom });
          return;
        }

        const described = describeAuthError(error, t);

        setState(
          described.tokenInvalid
            ? { kind: "invalid" }
            : { kind: "failed", message: described.alert.message },
        );
      },
    );
  }, [request, classifyError, attempt, t, token]);

  function retry() {
    setState({ kind: "loading" });
    setAttempt((current) => current + 1);
  }

  return { state, setState, result, retry };
}
