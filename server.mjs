import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || 8080);
const distDir = join(process.cwd(), "dist");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

async function readStatic(pathname) {
  const safe = normalize(pathname).replace(/^\.\.(\/|\\|$)/, "");
  return readFile(join(distDir, safe === "/" ? "index.html" : safe));
}

async function readIndex() {
  return readFile(join(distDir, "index.html"));
}

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);

  if (url.pathname === "/healthz") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  try {
    const body = await readStatic(url.pathname);
    const type = mimeTypes[extname(url.pathname)] || "application/octet-stream";
    response.writeHead(200, { "Content-Type": type });
    response.end(body);
  } catch {
    const body = await readIndex();
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(body);
  }
}).listen(port, "0.0.0.0");
