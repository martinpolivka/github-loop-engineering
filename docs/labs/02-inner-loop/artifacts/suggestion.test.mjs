import assert from "node:assert/strict";
import test from "node:test";
import { buildServer } from "../src/server.mjs";
import { createInventory, listStock, reserve } from "../src/inventory.mjs";

async function withServer(run) {
  const server = buildServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test("unit: selects the first eligible same-category SKU without mutation", () => {
  const inventory = createInventory();
  inventory.set("SKU-009", {
    sku: "SKU-009",
    name: "Synthetic Respiratory Option Nine",
    category: "drinkware",
    available: 5
  });
  inventory.set("SKU-000", {
    sku: "SKU-000",
    name: "Synthetic Respiratory Option Zero",
    category: "drinkware",
    available: 5
  });
  const before = listStock(inventory);

  assert.deepEqual(reserve(inventory, { sku: "SKU-003", quantity: 5 }), {
    status: 409,
    body: {
      error: "insufficient stock",
      available: 0,
      suggestion: {
        sku: "SKU-000",
        name: "Synthetic Respiratory Option Zero",
        available: 5
      }
    }
  });
  assert.deepEqual(listStock(inventory), before);
});

test("unit: omits a suggestion when no candidate satisfies the quantity", () => {
  const inventory = createInventory();
  inventory.get("SKU-004").available = 4;
  assert.deepEqual(reserve(inventory, { sku: "SKU-003", quantity: 5 }), {
    status: 409,
    body: { error: "insufficient stock", available: 0 }
  });
});

test("unit: partial availability remains a conflict, not an alternative-product request", () => {
  const inventory = createInventory();
  inventory.set("SKU-005", {
    sku: "SKU-005", name: "Synthetic Spare Bag", category: "bags", available: 5
  });
  const before = listStock(inventory);
  assert.deepEqual(reserve(inventory, { sku: "SKU-002", quantity: 5 }), {
    status: 409, body: { error: "insufficient stock", available: 4 }
  });
  assert.deepEqual(listStock(inventory), before);
});

test("http: returns one suggestion without reserving it", async () => {
  await withServer(async (baseUrl) => {
    const before = await fetch(`${baseUrl}/stock`).then((response) => response.json());
    const response = await fetch(`${baseUrl}/reservations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sku: "SKU-003", quantity: 1 })
    });
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), {
      error: "insufficient stock",
      available: 0,
      suggestion: {
        sku: "SKU-004",
        name: "Synthetic Travel Bottle",
        available: 6
      }
    });
    assert.deepEqual(await fetch(`${baseUrl}/stock`).then((result) => result.json()), before);
  });
});
