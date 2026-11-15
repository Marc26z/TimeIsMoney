import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(
  await readFile(path.join(root, "manifest.webmanifest"), "utf8"),
);
const sw = await readFile(path.join(root, "sw.js"), "utf8");
const html = await readFile(path.join(root, "index.html"), "utf8");

test("manifest is installable and uses relative URLs", () => {
  assert.equal(manifest.name, "TimeIsMoney");
  assert.equal(manifest.short_name, "TimeIsMoney");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.theme_color, "#f1ecdf");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
});

test("manifest icons exist and are PNGs or SVG", async () => {
  for (const icon of manifest.icons) {
    const file = path.join(root, icon.src);
    await access(file);
  }
});

test("HTML links the manifest and service worker entry point", () => {
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /<script type="module" src="src\/main\.js"><\/script>/);
  assert.match(html, /name="theme-color" content="#f1ecdf"/);
});

test("service worker pre-caches every local shell asset", async () => {
  const match = sw.match(/const SHELL = \[([\s\S]*?)\];/);
  assert.ok(match, "SHELL array is missing");
  const entries = [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
  assert.ok(entries.length >= 10);

  for (const entry of entries) {
    const relative = entry === "./" ? "index.html" : entry.replace(/^\.\//, "");
    await access(path.join(root, relative));
  }
});

test("service worker uses a cache-busted build id", () => {
  assert.match(sw, /const CACHE = "timeismoney-__BUILD_ID__";/);
  assert.match(sw, /skipWaiting\(\)/);
  assert.match(sw, /clients\.claim\(\)/);
});
