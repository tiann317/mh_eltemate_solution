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
  const safePath = normalize(pathname).replace(/^\.\.(\/|\\|$)/, "");
  const filePath = join(distDir, safePath === "/" ? "index.html" : safePath);
  return readFile(filePath);
}

async function readIndex() {
  return readFile(join(distDir, "index.html"));
}

async function getLDAToken() {
  if (!process.env.LDA_CLIENT_ID || !process.env.LDA_CLIENT_SECRET) {
    return null;
  }

  const response = await fetch("https://online.otto-schmidt.de/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.LDA_CLIENT_ID,
      client_secret: process.env.LDA_CLIENT_SECRET,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return typeof data.access_token === "string" ? data.access_token : null;
}

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);

  if (url.pathname === "/healthz") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname === "/api/lda-token") {
    try {
      const token = await getLDAToken();
      response.writeHead(token ? 200 : 503, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ configured: Boolean(token) }));
    } catch {
      response.writeHead(503, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ configured: false }));
    }
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