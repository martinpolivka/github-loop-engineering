import { initialStock } from "./catalog.mjs";

export { reserve } from "./reservations.mjs";

export function createInventory() {
  return new Map(initialStock().map((item) => [item.sku, item]));
}

export function listStock(inventory) {
  return [...inventory.values()].map((item) => ({ ...item }));
}
