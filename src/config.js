export function isAuthEnabled(env = import.meta.env) {
  return env.VITE_AUTH_ENABLED === "true";
}
