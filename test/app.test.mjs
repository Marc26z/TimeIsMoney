import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const dom = new JSDOM(html, {
  url: "https://timeismoney.test/",
  pretendToBeVisual: true,
});
const { window } = dom;

globalThis.window = window;
globalThis.document = window.document;

const { initApp } = await import("../src/app.js");

function inputEvent() {
  return new window.Event("input", { bubbles: true });
}

test("calculator initializes with the BLS benchmark", () => {
  initApp(window.document);
  assert.equal(window.document.getElementById("bench-weekly").textContent, "$1,232");
  assert.equal(window.document.getElementById("bench-hourly").textContent, "$30.80");
  assert.equal(window.document.getElementById("bench-period").textContent, "Q3 2026");
  assert.equal(window.document.getElementById("updated-date").textContent, "Nov 15, 2026");
  assert.equal(window.document.getElementById("result-hours").textContent, "0");
});

test("entering $200.45 shows 6h 30m", () => {
  const input = window.document.getElementById("price");
  input.value = "$200.45";
  input.dispatchEvent(inputEvent());

  assert.equal(window.document.getElementById("result-hours").textContent, "6");
  assert.equal(window.document.getElementById("result-minutes").textContent, "30");
  assert.equal(window.document.getElementById("stat-decimal").textContent, "6.51 h");
  assert.equal(window.document.getElementById("stat-days").textContent, "0.8");
  assert.equal(window.document.getElementById("stat-weeks").textContent, "0.16");
  assert.equal(
    window.document.getElementById("result-note").textContent,
    "About 6 hours and 30 minutes of gross pay.",
  );
  assert.equal(window.document.getElementById("result").dataset.state, "valid");
});

test("blur formats the entered amount", () => {
  const input = window.document.getElementById("price");
  input.value = "1234.5";
  input.dispatchEvent(inputEvent());
  input.focus();
  input.blur();
  assert.equal(input.value, "1,234.50");
});

test("invalid input gets a visible error state", () => {
  const input = window.document.getElementById("price");
  input.value = "12abc";
  input.dispatchEvent(inputEvent());
  assert.equal(window.document.getElementById("result").dataset.state, "invalid");
  assert.equal(window.document.getElementById("result-hours").textContent, "—");
  assert.equal(window.document.getElementById("input-hint").dataset.state, "error");
});

test("clear resets the result", () => {
  const input = window.document.getElementById("price");
  input.value = "200.45";
  input.dispatchEvent(inputEvent());
  window.document.getElementById("clear-btn").click();
  assert.equal(input.value, "");
  assert.equal(window.document.getElementById("result").dataset.state, "empty");
  assert.equal(window.document.getElementById("result-hours").textContent, "0");
  assert.equal(window.document.getElementById("result-minutes").textContent, "00");
});

test("example button fills the example price", () => {
  window.document.getElementById("example-btn").click();
  assert.equal(window.document.getElementById("price").value, "200.45");
  assert.equal(window.document.getElementById("result-hours").textContent, "6");
  assert.equal(window.document.getElementById("result-minutes").textContent, "30");
});
