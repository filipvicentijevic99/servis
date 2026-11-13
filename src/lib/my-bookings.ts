import { TIME_ZONE, formatBelgradeTime } from "./time";

export function bookingDateLabel(date: Date) {
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function bookingTimeLabel(start: Date, end: Date) {
  return `${formatBelgradeTime(start)}–${formatBelgradeTime(end)}`;
}
