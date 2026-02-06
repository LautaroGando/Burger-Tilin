import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStartOfDayInArgentina(date: Date = new Date()): Date {
  const argDateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);

  const startOfDay = new Date(argDateStr);
  return startOfDay;
}

export function getStartOfMonthInArgentina(date: Date = new Date()): Date {
  const argDateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "numeric",
  }).format(date);

  // argDateStr typically returns "M/YYYY" or similar depending on locale, but with "en-US" it's "MM/YYYY" or "M/D/YYYY"
  // Let's be safer:
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const month = parts.find((p) => p.type === "month")?.value;
  const year = parts.find((p) => p.type === "year")?.value;

  return new Date(`${month}/1/${year}`);
}
