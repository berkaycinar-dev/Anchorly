const BLOCKED_PATHS = ["/login", "/register"];

export default function getSafeNextPath(value, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return fallback;
  }

  if (value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  const pathname = value.split(/[?#]/)[0];

  if (BLOCKED_PATHS.includes(pathname)) {
    return fallback;
  }

  return value;
}

export function withNextPath(path, nextPath) {
  if (!nextPath || nextPath === "/") {
    return path;
  }

  return `${path}?next=${encodeURIComponent(nextPath)}`;
}
