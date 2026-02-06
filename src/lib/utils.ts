import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStartOfDayInArgentina(date: Date = new Date()): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value;

  const year = parseInt(getPart("year")!);
  const month = parseInt(getPart("month")!) - 1;
  const day = parseInt(getPart("day")!);

  // Argentina is UTC-3. 00:00 Arg = 03:00 UTC.
  return new Date(Date.UTC(year, month, day, 3, 0, 0, 0));
}

export function getStartOfMonthInArgentina(date: Date = new Date()): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value;

  const year = parseInt(getPart("year")!);
  const month = parseInt(getPart("month")!) - 1;

  // 1st of month at 00:00 Arg = 03:00 UTC.
  return new Date(Date.UTC(year, month, 1, 3, 0, 0, 0));
}
