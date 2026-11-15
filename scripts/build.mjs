import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, "dist");
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const buildId = `${pkg.version}-${Date.now().toString(36)}`;

const FILES = ["index.html", "styles.css", "manifest.webmanifest"];
const DIRS = ["src", "icons"];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await Promise.all(
  FILES.map((file) => cp(path.join(root, file), path.join(dist, file))),
);
await Promise.all(
  DIRS.map((dir) => cp(path.join(root, dir), path.join(dist, dir), { recursive: true })),
);

const sw = await readFile(path.join(root, "sw.js"), "utf8");
await writeFile(path.join(dist, "sw.js"), sw.replaceAll("__BUILD_ID__", buildId));
await writeFile(path.join(dist, ".nojekyll"), "");

console.log(`Built dist/ (${buildId})`);
