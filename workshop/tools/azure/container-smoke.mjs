import assert from "node:assert/strict";

const base = process.argv[2];
if (!/^http:\/\/127\.0\.0\.1:[0-9]+$/.test(base ?? "")) throw new Error("Use the exact loopback container URL.");
async function json(path, options) {
  const response = await fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(10_000) });
  assert.equal(response.status, path === "/reservations" ? 201 : 200);
  return response.json();
}
assert.deepEqual(await json("/health"), { status: "ready", service: "retail-reservation" });
const before = await json("/stock");
assert.equal(before.items.find((item) => item.sku === "SKU-001").available, 12);
const result = await json("/reservations", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ sku: "SKU-001", quantity: 1 })
});
assert.deepEqual(result, {
  reservationId: "RSV-SKU-001-11", sku: "SKU-001", quantity: 1, remaining: 11
});
const after = await json("/stock");
assert.equal(after.items.find((item) => item.sku === "SKU-001").available, 11);
assert.deepEqual(after.items.filter((item) => item.sku !== "SKU-001"),
  before.items.filter((item) => item.sku !== "SKU-001"));
console.log("Container smoke checks passed: health, stock-read, synthetic-reservation.");
