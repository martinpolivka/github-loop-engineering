import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createInventory, listStock, reserve } from "./inventory.mjs";

const publicDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const staticRoutes = new Map([
  ["/", { file: "index.html", contentType: "text/html; charset=utf-8" }],
  ["/app.js", { file: "app.js", contentType: "text/javascript; charset=utf-8" }],
  ["/app.css", { file: "app.css", contentType: "text/css; charset=utf-8" }]
]);

function sendJson(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

export function buildServer({ allowedOrigin = "" } = {}) {
  if (allowedOrigin && !/^https?:\/\/[a-zA-Z0-9.-]+(?::[0-9]+)?$/.test(allowedOrigin)) {
    throw new Error("CORS origin must be one explicit HTTP(S) origin without a path or wildcard.");
  }
  const inventory = createInventory();

  return createServer(async (request, response) => {
    if (allowedOrigin && request.headers.origin === allowedOrigin) {
      response.setHeader("access-control-allow-origin", allowedOrigin);
      response.setHeader("vary", "Origin");
      if (request.method === "OPTIONS" && ["/health", "/stock", "/reservations"].includes(request.url)) {
        response.writeHead(204, {
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "content-type",
          "access-control-max-age": "600"
        }).end();
        return;
      }
    }
    const staticAsset = request.method === "GET" ? staticRoutes.get(request.url) : undefined;
    if (staticAsset) {
      try {
        const body = await readFile(join(publicDirectory, staticAsset.file));
        response.writeHead(200, { "content-type": staticAsset.contentType });
        response.end(body);
      } catch {
        sendJson(response, 500, { error: "static asset unavailable" });
      }
      return;
    }

    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, {
        status: "ready",
        service: "retail-reservation"
      });
      return;
    }

    if (request.method === "GET" && request.url === "/stock") {
      sendJson(response, 200, { items: listStock(inventory) });
      return;
    }

    if (request.method === "POST" && request.url === "/reservations") {
      let raw = "";
      for await (const chunk of request) {
        raw += chunk;
        if (raw.length > 16_384) {
          sendJson(response, 413, { error: "request too large" });
          return;
        }
      }

      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        sendJson(response, 400, { error: "invalid JSON" });
        return;
      }

      const result = reserve(inventory, payload);
      sendJson(response, result.status, result.body);
      return;
    }

    sendJson(response, 404, { error: "route not found" });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3000);
  const server = buildServer({ allowedOrigin: process.env.ALLOWED_ORIGIN ?? "" });
  const host = process.env.HOST ?? "127.0.0.1";
  server.listen(port, host, () => {
    console.log(`Retail reservation service listening on http://${host}:${server.address().port}`);
  });
}
