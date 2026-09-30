import assert from "node:assert/strict";
import test from "node:test";
import { buildServer } from "../src/server.mjs";

async function withServer(options, run) {
  const server = buildServer(options);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("CORS is disabled by default for the same-origin storefront", async () => {
  await withServer({}, async (url) => {
    const response = await fetch(`${url}/stock`, { headers: { origin: "https://example.invalid" } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
});

test("one explicit allowed origin gets preflight and API headers, never credentials", async () => {
  await withServer({ allowedOrigin: "https://store.example.invalid" }, async (url) => {
    const headers = { origin: "https://store.example.invalid" };
    const preflight = await fetch(`${url}/reservations`, { method: "OPTIONS", headers });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-origin"), headers.origin);
    assert.equal(preflight.headers.get("access-control-allow-credentials"), null);
    const stock = await fetch(`${url}/stock`, { headers });
    assert.equal(stock.status, 200);
    assert.equal(stock.headers.get("vary"), "Origin");
    assert.equal(stock.headers.get("access-control-allow-origin"), headers.origin);
    const denied = await fetch(`${url}/stock`, { headers: { origin: "https://other.example.invalid" } });
    assert.equal(denied.headers.get("access-control-allow-origin"), null);
    assert.equal((await stock.json()).items.length, 4);
  });
});

test("CORS does not expose unknown routes and rejects wildcards or paths", async () => {
  for (const allowedOrigin of ["*", "https://example.invalid/path", "javascript:alert(1)"]) {
    assert.throws(() => buildServer({ allowedOrigin }), /explicit/);
  }
  await withServer({ allowedOrigin: "https://store.example.invalid" }, async (url) => {
    const response = await fetch(`${url}/missing`, {
      method: "OPTIONS", headers: { origin: "https://store.example.invalid" }
    });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "route not found" });
  });
});
