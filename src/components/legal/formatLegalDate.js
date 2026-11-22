import { LEGAL_UPDATED_AT } from "../../constants/legal";

export default function formatLegalDate(language) {
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${LEGAL_UPDATED_AT}T00:00:00Z`));
}
