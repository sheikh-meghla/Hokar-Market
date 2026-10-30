import type { OrderStatus } from "../app/generated/prisma/enums";

// Statuses an admin may move an order to. PAID and REFUNDED are never set by
// hand: there is no payment verification yet, so nothing may claim a payment.
export const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

// Revenue = money actually collected: orders paid online or delivered (cash on
// delivery is collected on delivery). Everything else is only order value.
export const REVENUE_STATUSES: OrderStatus[] = ["PAID", "DELIVERED"];
export const INACTIVE_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED"];

export const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return ALL_STATUSES.includes(value as OrderStatus);
}
