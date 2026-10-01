const products = [
  { sku: "SKU-001", name: "Synthetic Notebook", category: "stationery", available: 12 },
  { sku: "SKU-002", name: "Synthetic Canvas Bag", category: "bags", available: 4 },
  { sku: "SKU-003", name: "Synthetic Insulated Bottle", category: "drinkware", available: 0 },
  { sku: "SKU-004", name: "Synthetic Travel Bottle", category: "drinkware", available: 6 }
];

export function initialStock() {
  return products.map((product) => ({ ...product }));
}
