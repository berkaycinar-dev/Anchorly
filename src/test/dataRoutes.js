import { DEFAULT_SETTINGS } from "../constants/settings";

const EMPTY_DATA = {
  "/me/settings": DEFAULT_SETTINGS,
  "/projects": [],
  "/routines": [],
  "/routines/checks": [],
  "/tasks": [],
};

export function respondToDataRoute(url, init, language = "en") {
  const path = String(url)
    .replace(/^\/api/, "")
    .split("?")[0];
  const method = init?.method ?? "GET";

  if (method !== "GET" || !Object.hasOwn(EMPTY_DATA, path)) {
    return null;
  }

  const body =
    path === "/me/settings"
      ? { ...EMPTY_DATA[path], language }
      : EMPTY_DATA[path];

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
