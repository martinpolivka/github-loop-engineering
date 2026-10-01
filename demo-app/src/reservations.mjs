export function reserve(inventory, request) {
  if (!request || typeof request.sku !== "string") {
    return { status: 400, body: { error: "sku is required" } };
  }
  if (!Number.isInteger(request.quantity) || request.quantity < 1 || request.quantity > 5) {
    return { status: 400, body: { error: "quantity must be an integer from 1 to 5" } };
  }

  const item = inventory.get(request.sku);
  if (!item) {
    return { status: 404, body: { error: "item not found" } };
  }
  if (item.available < request.quantity) {
    return {
      status: 409,
      body: { error: "insufficient stock", available: item.available }
    };
  }

  item.available -= request.quantity;
  return {
    status: 201,
    body: {
      reservationId: `RSV-${request.sku}-${String(item.available).padStart(2, "0")}`,
      sku: request.sku,
      quantity: request.quantity,
      remaining: item.available
    }
  };
}
