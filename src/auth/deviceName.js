const BROWSERS = [
  ["Edg/", "Edge"],
  ["EdgA/", "Edge"],
  ["OPR/", "Opera"],
  ["Firefox/", "Firefox"],
  ["FxiOS/", "Firefox"],
  ["CriOS/", "Chrome"],
  ["Chrome/", "Chrome"],
  ["Safari/", "Safari"],
];

const SYSTEMS = [
  ["Windows", "Windows"],
  ["Android", "Android"],
  ["iPhone", "iOS"],
  ["iPad", "iOS"],
  ["Macintosh", "macOS"],
  ["CrOS", "ChromeOS"],
  ["Linux", "Linux"],
];

function findName(userAgent, table) {
  const match = table.find(([marker]) => userAgent.includes(marker));
  return match ? match[1] : null;
}

export default function getDeviceName(
  userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent,
) {
  const browser = findName(userAgent, BROWSERS);
  const system = findName(userAgent, SYSTEMS);
  const parts = [browser, system].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : null;
}
