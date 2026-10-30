import type { Localized } from "./translations";

// Types and pure validation for orders. Prices, names and stock are looked up
// from the database in lib/order-server.ts; the browser only sends ids/options.

/** Flat delivery fee in BDT. No fee rule is configured for the business yet. */
export const SHIPPING_FEE = 0;

export type OrderLineInput = {
  id: string;
  color?: string;
  size?: string;
  quantity: number;
};

export type LineIssue =
  | "unavailable"
  | "outOfStock"
  | "invalidSize"
  | "invalidColor"
  | "invalidQuantity";

export type VerifiedLine = {
  key: string;
  id: string;
  slug: string;
  name: Localized;
  image?: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type LineProblem = { key: string; issue: LineIssue };

export type VerifiedOrder = {
  lines: VerifiedLine[];
  problems: LineProblem[];
  subtotal: number;
  shippingFee: number;
  total: number;
};

export type CustomerInput = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  /** Optional delivery instructions. */
  deliveryNote: string;
};

export type CustomerField = keyof CustomerInput;
export type FieldErrors = Partial<Record<CustomerField, "required" | "invalid">>;

export function validateCustomer(raw: unknown): {
  customer: CustomerInput;
  errors: FieldErrors;
} {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const read = (name: CustomerField) =>
    typeof source[name] === "string" ? (source[name] as string).trim() : "";

  const customer: CustomerInput = {
    fullName: read("fullName"),
    phone: read("phone").replace(/[\s-]/g, ""),
    address: read("address"),
    city: read("city"),
    postalCode: read("postalCode"),
    deliveryNote: read("deliveryNote"),
  };

  const errors: FieldErrors = {};
  const rules: Record<CustomerField, (value: string) => boolean> = {
    fullName: (value) => value.length >= 2 && value.length <= 100,
    phone: (value) => /^(?:\+?88)?01[3-9]\d{8}$/.test(value),
    address: (value) => value.length >= 5 && value.length <= 300,
    city: (value) => value.length >= 2 && value.length <= 100,
    postalCode: (value) => /^\d{4}$/.test(value),
    deliveryNote: (value) => value.length <= 300,
  };
  for (const field of Object.keys(rules) as CustomerField[]) {
    if (!customer[field]) {
      // Delivery instructions are optional.
      if (field !== "deliveryNote") errors[field] = "required";
    } else if (!rules[field](customer[field])) errors[field] = "invalid";
  }

  return { customer, errors };
}

