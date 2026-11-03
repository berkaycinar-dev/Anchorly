import { parseLocalDate } from "./dateHelpers";

export function formatShortDate(dateString, locale) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(parseLocalDate(dateString));
}

export function formatWeekdayDate(dateString, locale) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parseLocalDate(dateString));
}
