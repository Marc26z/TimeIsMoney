import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const requestedRoot = process.argv[2] ?? ".";
const root = path.resolve(process.cwd(), requestedRoot);
const port = Number(process.env.PORT ?? 8000);

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".ico", "image/x-icon"],
]);

function headersFor(filename, bodyLength) {
  return {
    "Content-Type": types.get(path.extname(filename)) ?? "application/octet-stream",
    "Content-Length": bodyLength,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";

    const filename = path.resolve(root, `.${pathname}`);
    if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }

    const info = await stat(filename);
    if (!info.isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }

    const body = await readFile(filename);
    response.writeHead(200, headersFor(filename, body.length)).end(body);
  } catch (error) {
    if (error?.code === "ENOENT") {
      response.writeHead(404).end("Not found");
      return;
    }
    console.error(error);
    response.writeHead(500).end("Server error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Serving ${root} at http://localhost:${port}/`);
});
