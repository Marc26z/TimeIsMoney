import assert from "node:assert/strict";
import test from "node:test";
import { BLS } from "../src/data.js";
import {
  annualizedEarnings,
  durationParts,
  formatDuration,
  formatPrice,
  formatRate,
  formatWeeklyEarnings,
  hourlyRate,
  parsePrice,
  priceToHours,
  resultForPrice,
} from "../src/core.js";

test("BLS data is present and internally consistent", () => {
  assert.equal(BLS.seriesId, "LEU0252881500");
  assert.equal(BLS.period, "2026 Q3");
  assert.equal(BLS.periodLabel, "Q3 2026");
  assert.equal(BLS.weeklyEarnings, 1232);
  assert.equal(BLS.hoursPerWeek, 40);
  assert.equal(BLS.seasonallyAdjusted, false);
  assert.match(BLS.sourceUrl, /^https:\/\/www\.bls\.gov\//);
});

test("hourly rate comes from median weekly earnings", () => {
  assert.equal(hourlyRate(), 30.8);
  assert.equal(annualizedEarnings(), 64064);
  assert.equal(formatWeeklyEarnings(), "$1,232");
  assert.equal(formatRate(hourlyRate()), "$30.80");
});

test("parsePrice accepts common price formats", () => {
  assert.equal(parsePrice("200.45"), 200.45);
  assert.equal(parsePrice("$200.45"), 200.45);
  assert.equal(parsePrice("$ 200.45"), 200.45);
  assert.equal(parsePrice("1,234.56"), 1234.56);
  assert.equal(parsePrice("  $1,234 "), 1234);
  assert.equal(parsePrice(".99"), 0.99);
  assert.equal(parsePrice("0"), 0);
});

test("parsePrice rejects malformed or negative amounts", () => {
  for (const value of ["", " ", "$", ".", "-20", "12abc", "1.2.3", "1,23", "200,45", null]) {
    assert.equal(parsePrice(value), null, `expected null for ${JSON.stringify(value)}`);
  }
});

test("priceToHours divides by the median hourly rate", () => {
  assert.equal(priceToHours(30.8), 1);
  assert.equal(priceToHours(200.45), 200.45 / 30.8);
  assert.equal(priceToHours(-1), null);
  assert.equal(priceToHours(10, 0), null);
});

test("durationParts rounds to the nearest minute and normalizes 60 minutes", () => {
  assert.deepEqual(durationParts(6.508116883116884), {
    hours: 6,
    minutes: 30,
    totalMinutes: 390,
  });
  assert.deepEqual(durationParts(1.999), { hours: 2, minutes: 0, totalMinutes: 120 });
  assert.deepEqual(durationParts(1 / 120), {
    hours: 0,
    minutes: 1,
    totalMinutes: 1,
  });
  assert.equal(formatDuration(6.508116883116884), "6h 30m");
});

test("resultForPrice produces display-ready fields", () => {
  const result = resultForPrice(200.45);
  assert.equal(result.rate, 30.8);
  assert.equal(result.parts.hours, 6);
  assert.equal(result.parts.minutes, 30);
  assert.equal(result.decimalHours, "6.51");
  assert.equal(result.workdays, "0.8");
  assert.equal(result.workweeks, "0.16");
  assert.equal(formatPrice(200.45), "$200.45");
});

test("zero has a clean result", () => {
  const result = resultForPrice(0);
  assert.equal(result.parts.totalMinutes, 0);
  assert.equal(formatDuration(0), "0h 00m");
  assert.equal(result.workdays, "0.0");
  assert.equal(result.workweeks, "0.00");
});
