import { BLS } from "./data.js";

export const HOURS_PER_WORKDAY = 8;
export const HOURS_PER_WORKWEEK = 40;
export const HOURS_PER_WORKYEAR = HOURS_PER_WORKWEEK * 52;

const decimal = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const oneDecimal = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const twoDecimals = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const threeDecimals = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const whole = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const wholeCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Parse a typed or pasted price, forgiving $, commas and surrounding space. */
export function parsePrice(input) {
  if (typeof input !== "string" && typeof input !== "number") return null;

  let value = String(input).trim();
  if (!value) return null;

  value = value.replace(/^\$\s*/, "").replace(/\s+/g, "");
  const grouped = /^\d{1,3}(?:,\d{3})+(?:\.\d*)?$/.test(value);
  const plain = /^\d*\.?\d*$/.test(value);
  if (!grouped && !plain) return null;
  if (value === "" || value === ".") return null;

  const amount = Number(value.replace(/,/g, ""));
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

export function hourlyRate(data = BLS) {
  return data.weeklyEarnings / data.hoursPerWeek;
}

export function annualizedEarnings(data = BLS) {
  return data.weeklyEarnings * 52;
}

export function priceToHours(price, rate = hourlyRate()) {
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(rate) || rate <= 0) {
    return null;
  }
  return price / rate;
}

/** Split decimal hours into rounded whole hours and minutes. */
export function durationParts(hours) {
  if (!Number.isFinite(hours) || hours < 0) {
    return { hours: 0, minutes: 0, totalMinutes: 0 };
  }

  const totalMinutes = Math.round(hours * 60);
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes,
  };
}

export function formatDuration(hours) {
  const parts = durationParts(hours);
  return `${whole.format(parts.hours)}h ${String(parts.minutes).padStart(2, "0")}m`;
}

export function formatDecimalHours(hours) {
  return decimal.format(hours);
}

export function formatPrice(amount) {
  return currency.format(amount);
}

export function formatRate(amount) {
  return currency.format(amount);
}

export function formatWorkdays(hours) {
  const days = hours / HOURS_PER_WORKDAY;
  if (days > 0 && days < 0.05) return "<0.1";
  return oneDecimal.format(days);
}

export function formatWorkweeks(hours) {
  const weeks = hours / HOURS_PER_WORKWEEK;
  if (weeks > 0 && weeks < 0.005) return "<0.01";
  return twoDecimals.format(weeks);
}

export function formatWorkyears(hours) {
  const years = hours / HOURS_PER_WORKYEAR;
  if (years > 0 && years < 0.0005) return "<0.001";
  return threeDecimals.format(years);
}

export function formatWeeklyEarnings(data = BLS) {
  return wholeCurrency.format(data.weeklyEarnings);
}

export function formatAnnualized(data = BLS) {
  return wholeCurrency.format(annualizedEarnings(data));
}

export function resultForPrice(price, data = BLS) {
  const rate = hourlyRate(data);
  const hours = priceToHours(price, rate);
  if (hours === null) return null;

  return {
    hours,
    rate,
    parts: durationParts(hours),
    decimalHours: formatDecimalHours(hours),
    workdays: formatWorkdays(hours),
    workweeks: formatWorkweeks(hours),
    workyears: formatWorkyears(hours),
  };
}
