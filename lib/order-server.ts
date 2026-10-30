import { randomBytes } from "node:crypto";
import { Prisma } from "../app/generated/prisma/client";
import { lineKey, MAX_QUANTITY } from "./cart-shared";
import {
  SHIPPING_FEE,
  type CustomerInput,
  type VerifiedLine,
  type VerifiedOrder,
} from "./order";
import { prisma } from "./prisma";

// A Prisma client or the client handed to a transaction callback.
type Db = Prisma.TransactionClient | typeof prisma;

function optionalString(value: unknown) {
  return typeof value === "string" && value !== "" ? value : undefined;
}

/**
 * Prices a selection from the database. Only ids, options and quantities are
 * read from `raw`; names, prices and stock always come from the Product table.
 */
export async function verifyLines(
  raw: unknown,
  db: Db = prisma,
): Promise<VerifiedOrder> {
  const result: VerifiedOrder = {
    lines: [],
    problems: [],
    subtotal: 0,
    shippingFee: 0,
    total: 0,
  };
  if (!Array.isArray(raw)) return result;

  const entries = raw
    .slice(0, 100)
    .filter(
      (entry): entry is { id: string; [key: string]: unknown } =>
        !!entry && typeof entry === "object" && typeof entry.id === "string",
    );

  const found = await db.product.findMany({
    where: { id: { in: entries.map((entry) => entry.id) } },
  });
  const byId = new Map(found.map((product) => [product.id, product]));
  const seen = new Set<string>();

  for (const entry of entries) {
    const color = optionalString(entry.color);
    const size = optionalString(entry.size);
    const key = lineKey({ id: entry.id, color, size });
    if (seen.has(key)) continue; // a variant can only be ordered once
    seen.add(key);

    const product = byId.get(entry.id);
    if (!product || !product.isActive) {
      result.problems.push({ key, issue: "unavailable" });
      continue;
    }

    const quantity = entry.quantity;
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_QUANTITY
    ) {
      result.problems.push({ key, issue: "invalidQuantity" });
      continue;
    }
    if (quantity > product.stock) {
      result.problems.push({ key, issue: "outOfStock" });
      continue;
    }
    if (product.sizes.length ? !size || !product.sizes.includes(size) : size) {
      result.problems.push({ key, issue: "invalidSize" });
      continue;
    }
    if (
      product.colors.length ? !color || !product.colors.includes(color) : color
    ) {
      result.problems.push({ key, issue: "invalidColor" });
      continue;
    }

    const unitPrice = Number(product.price);
    result.lines.push({
      key,
      id: product.id,
      slug: product.slug,
      name: { en: product.name, bn: product.nameBn ?? product.name },
      image: product.images[0],
      color,
      size,
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    });
  }

  result.subtotal = result.lines.reduce((sum, line) => sum + line.lineTotal, 0);
  result.shippingFee = result.lines.length > 0 ? SHIPPING_FEE : 0;
  result.total = result.subtotal + result.shippingFee;
  return result;
}

export type CreatedOrder = {
  orderNumber: string;
  accessToken: string;
  lines: VerifiedLine[];
  subtotal: number;
  shippingFee: number;
  total: number;
  orderedKeys: string[];
};

export type CreateOrderOutcome =
  | { status: "created" | "existing"; order: CreatedOrder }
  | { status: "invalid"; verified: VerifiedOrder };

function newOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `CG-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

class LinesChanged extends Error {
  constructor(readonly verified: VerifiedOrder) {
    super("Order lines changed while placing the order");
  }
}

function isUniqueViolation(error: unknown, field: string) {
  // The pg driver adapter reports the violated column inside meta, in a shape
  // that differs from the native engine, so search the whole meta object.
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    JSON.stringify(error.meta ?? {}).includes(field)
  );
}

async function loadExisting(idempotencyKey: string): Promise<CreatedOrder | null> {
  const order = await prisma.order.findUnique({
    where: { idempotencyKey },
    include: { items: true },
  });
  if (!order) return null;

  const products = await prisma.product.findMany({
    where: { id: { in: order.items.map((item) => item.productId) } },
  });
  const byId = new Map(products.map((product) => [product.id, product]));

  const lines: VerifiedLine[] = order.items.map((item) => {
    const product = byId.get(item.productId);
    const unitPrice = Number(item.price);
    return {
      key: lineKey({
        id: item.productId,
        color: item.color ?? undefined,
        size: item.size ?? undefined,
      }),
      id: item.productId,
      slug: product?.slug ?? item.productId,
      name: { en: item.productName, bn: product?.nameBn ?? item.productName },
      image: product?.images[0],
      color: item.color ?? undefined,
      size: item.size ?? undefined,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    };
  });

  return {
    orderNumber: order.orderNumber,
    accessToken: order.accessToken,
    lines,
    subtotal: Number(order.subtotalAmount),
    shippingFee: Number(order.shippingFee),
    total: Number(order.totalAmount),
    orderedKeys: lines.map((line) => line.key),
  };
}

/**
 * Saves the order, its items and the stock decrement in ONE transaction, so an
 * order never exists half-written. Re-sending the same idempotency key returns
 * the order that was already saved instead of creating another.
 */
export async function createOrder(params: {
  idempotencyKey: string;
  rawLines: unknown;
  customer: CustomerInput;
  userId?: string | null;
}): Promise<CreateOrderOutcome> {
  const { idempotencyKey, rawLines, customer, userId } = params;

  const existing = await loadExisting(idempotencyKey);
  if (existing) return { status: "existing", order: existing };

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Re-read prices and stock inside the transaction so the saved numbers
      // are exactly the ones that were checked.
      const verified = await verifyLines(rawLines, tx);
      if (verified.problems.length > 0 || verified.lines.length === 0) {
        throw new LinesChanged(verified);
      }

      for (const line of verified.lines) {
        const updated = await tx.product.updateMany({
          where: {
            id: line.id,
            isActive: true,
            stock: { gte: line.quantity },
          },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count !== 1) {
          throw new LinesChanged({
            ...verified,
            lines: verified.lines.filter((item) => item.key !== line.key),
            problems: [{ key: line.key, issue: "outOfStock" }],
          });
        }
      }

      const order = await tx.order.create({
        data: {
          orderNumber: newOrderNumber(),
          idempotencyKey,
          userId: userId ?? null,
          paymentMethod: "COD",
          subtotalAmount: verified.subtotal,
          shippingFee: verified.shippingFee,
          totalAmount: verified.total,
          deliveryNote: customer.deliveryNote || null,
          shippingName: customer.fullName,
          shippingPhone: customer.phone,
          shippingLine1: customer.address,
          shippingCity: customer.city,
          shippingPostalCode: customer.postalCode,
          shippingCountry: "Bangladesh",
          items: {
            create: verified.lines.map((line) => ({
              productId: line.id,
              productName: line.name.en,
              size: line.size ?? null,
              color: line.color ?? null,
              quantity: line.quantity,
              price: line.unitPrice,
            })),
          },
        },
      });

      return { order, verified };
    });

    return {
      status: "created",
      order: {
        orderNumber: created.order.orderNumber,
        accessToken: created.order.accessToken,
        lines: created.verified.lines,
        subtotal: created.verified.subtotal,
        shippingFee: created.verified.shippingFee,
        total: created.verified.total,
        orderedKeys: created.verified.lines.map((line) => line.key),
      },
    };
  } catch (error) {
    if (error instanceof LinesChanged) {
      return { status: "invalid", verified: error.verified };
    }
    // A parallel request with the same key won the race: return its order.
    if (isUniqueViolation(error, "idempotencyKey")) {
      const raced = await loadExisting(idempotencyKey);
      if (raced) return { status: "existing", order: raced };
    }
    throw error;
  }
}

/** Loads an order for the confirmation page; the access token must match. */
export async function getOrderForConfirmation(
  orderNumber: string,
  accessToken: string,
) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: { include: { product: true } } },
  });
  if (!order || order.accessToken !== accessToken) return null;
  return order;
}
