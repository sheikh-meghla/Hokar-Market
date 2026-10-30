"use server";

import {
  validateCustomer,
  type CustomerInput,
  type FieldErrors,
  type LineProblem,
  type VerifiedLine,
} from "@/lib/order";
import { getCurrentUser } from "@/lib/auth";
import { createOrder, verifyLines } from "@/lib/order-server";

export type QuoteResult = {
  lines: VerifiedLine[];
  problems: LineProblem[];
  subtotal: number;
  shippingFee: number;
  total: number;
};

export type PlaceOrderResult =
  | {
      ok: true;
      orderNumber: string;
      /** Secret for the confirmation link; proves the visitor placed the order. */
      accessToken: string;
      /** Cart line keys that were ordered and can leave the cart. */
      orderedKeys: string[];
    }
  | {
      ok: false;
      reason: "empty" | "lines" | "fields" | "error";
      lines: VerifiedLine[];
      problems: LineProblem[];
      fieldErrors: FieldErrors;
      subtotal: number;
      shippingFee: number;
      total: number;
    };

/** Prices a selection from the database. Nothing the client sends is trusted. */
export async function quoteOrder(lines: unknown): Promise<QuoteResult> {
  return verifyLines(lines);
}

export async function placeOrder(input: {
  idempotencyKey: string;
  lines: unknown;
  customer: CustomerInput;
}): Promise<PlaceOrderResult> {
  const idempotencyKey =
    typeof input?.idempotencyKey === "string" &&
    /^[\w-]{8,64}$/.test(input.idempotencyKey)
      ? input.idempotencyKey
      : null;

  const { customer, errors } = validateCustomer(input?.customer);
  const failure = (
    reason: "empty" | "lines" | "fields" | "error",
    verified: QuoteResult,
  ): PlaceOrderResult => ({
    ok: false,
    reason,
    ...verified,
    fieldErrors: errors,
  });

  try {
    const verified = await verifyLines(input?.lines);

    if (verified.lines.length === 0 && verified.problems.length === 0) {
      return failure("empty", verified);
    }
    if (verified.problems.length > 0) return failure("lines", verified);
    if (!idempotencyKey || Object.keys(errors).length > 0) {
      return failure("fields", verified);
    }

    // Signed-in customers get the order attached to their account; guests still can order.
    const user = await getCurrentUser();
    const outcome = await createOrder({
      userId: user?.role === "CUSTOMER" ? user.id : null,
      idempotencyKey,
      rawLines: input.lines,
      customer,
    });

    if (outcome.status === "invalid") return failure("lines", outcome.verified);

    return {
      ok: true,
      orderNumber: outcome.order.orderNumber,
      accessToken: outcome.order.accessToken,
      orderedKeys: outcome.order.orderedKeys,
    };
  } catch (error) {
    // Never report success when the order could not be saved.
    console.error("placeOrder failed:", error instanceof Error ? error.message : error);
    return failure("error", {
      lines: [],
      problems: [],
      subtotal: 0,
      shippingFee: 0,
      total: 0,
    });
  }
}
