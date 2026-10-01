import assert from "node:assert/strict";
import test from "node:test";
import { initialStock } from "../src/catalog.mjs";
import { createInventory, reserve } from "../src/inventory.mjs";

test("catalog and inventory snapshots cannot mutate future retail seeds", () => {
  initialStock()[0].available = 0;
  createInventory().get("SKU-001").available = 0;
  assert.equal(initialStock()[0].available, 12);
  assert.equal(createInventory().get("SKU-001").available, 12);
});

test("both learner tasks remain unsolved in the retail baseline", () => {
  const inventory = createInventory();
  assert.deepEqual(reserve(inventory, { sku: "SKU-003", quantity: 1 }), {
    status: 409, body: { error: "insufficient stock", available: 0 }
  });
  assert.deepEqual(reserve(inventory, { sku: "SKU-002", quantity: 5 }), {
    status: 409, body: { error: "insufficient stock", available: 4 }
  });
  assert.equal(inventory.get("SKU-002").available, 4);
});
