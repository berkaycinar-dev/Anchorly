import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

function readToken(hash) {
  return new URLSearchParams(hash.replace(/^#/, "")).get("token") ?? "";
}

// Reads `#token=…` once and removes it from the address bar so the token does
// not stay in history.
export default function useHashToken() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const tokenState = useState(() => readToken(hash));

  useEffect(() => {
    if (hash !== "") {
      navigate({ hash: "" }, { replace: true });
    }
  }, [hash, navigate]);

  return tokenState;
}
