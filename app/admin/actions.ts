"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "../generated/prisma/client";
import { audit, createSession, destroySession, requireAdmin } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { allowedTransitions, isOrderStatus } from "@/lib/admin-orders";
import { parseProductForm, type ProductFormState } from "@/lib/admin-product";
import type { TranslationKey } from "@/lib/translations";

// ---------------------------------------------------------------- sign in/out

export type LoginState = { error?: TranslationKey; email?: string };

// Best-effort brute-force limit per client address (per server instance).
const attempts = new Map<string, { count: number; since: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
// A real hash to compare against when the email is unknown, so timing does not
// reveal which emails have accounts.
const DUMMY_HASH =
  "scrypt$00000000000000000000000000000000$" + "0".repeat(128);

export async function loginAdmin(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const forwarded = (await headers()).get("x-forwarded-for");
  const client = forwarded?.split(",")[0]?.trim() || "local";

  const entry = attempts.get(client);
  if (entry && Date.now() - entry.since > WINDOW_MS) attempts.delete(client);
  const current = attempts.get(client);
  if (current && current.count >= MAX_ATTEMPTS) {
    return { error: "aLoginLocked", email: String(formData.get("email") ?? "") };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user =
    email.length > 0 && email.length <= 254
      ? await prisma.user.findUnique({ where: { email } })
      : null;
  const valid = await verifyPassword(
    password.slice(0, 200),
    user?.passwordHash ?? DUMMY_HASH,
  );

  // Same answer for "no such user", "wrong password" and "not an admin".
  if (!user || !valid || user.role !== "ADMIN") {
    const next = attempts.get(client) ?? { count: 0, since: Date.now() };
    attempts.set(client, { count: next.count + 1, since: next.since });
    // Echo the email so React resetting the form does not make people retype it.
    return { error: "aLoginFailed", email };
  }

  attempts.delete(client);
  await createSession(user.id);
  await audit(
    { id: user.id, name: user.name, email: user.email, role: "ADMIN" },
    "login",
    "User",
    user.id,
  );
  redirect("/admin");
}

export async function logoutAdmin() {
  await destroySession();
  redirect("/admin/login");
}

// ------------------------------------------------------------------- products

const categorySlug = { ring: "rings", necklace: "necklaces", bracelet: "bracelets" };
const genderValue = { men: "MALE", women: "FEMALE" } as const;

function uniqueField(error: unknown): "slug" | "sku" | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const meta = JSON.stringify(error.meta ?? {});
    if (meta.includes("sku")) return "sku";
    if (meta.includes("slug")) return "slug";
  }
  return null;
}

function echo(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

export async function saveProduct(
  _previous: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const admin = await requireAdmin();

  const { data, fieldErrors } = parseProductForm(formData);
  if (!data) return { ok: false, fieldErrors, values: echo(formData) };

  const id = String(formData.get("id") ?? "");

  const category = await prisma.category.findUnique({
    where: { slug: categorySlug[data.category] },
  });
  if (!category) {
    return { ok: false, message: "aErrCategoryMissing", fieldErrors: {}, values: echo(formData) };
  }

  const values = {
    name: data.name,
    nameBn: data.nameBn,
    slug: data.slug,
    sku: data.sku,
    description: data.description,
    descriptionBn: data.descriptionBn,
    price: data.price,
    oldPrice: data.oldPrice,
    stock: data.stock,
    gender: genderValue[data.gender],
    sizes: data.sizes,
    colors: data.colors,
    images: data.images,
    isActive: data.isActive,
    categoryId: category.id,
  };

  let savedId: string;
  try {
    if (id) {
      const updated = await prisma.product.update({ where: { id }, data: values });
      savedId = updated.id;
      await audit(admin, "product.update", "Product", savedId, { slug: data.slug });
    } else {
      const created = await prisma.product.create({ data: values });
      savedId = created.id;
      await audit(admin, "product.create", "Product", savedId, { slug: data.slug });
    }
  } catch (error) {
    const duplicate = uniqueField(error);
    if (duplicate === "slug") {
      return { ok: false, fieldErrors: { slug: "aErrDuplicateSlug" }, values: echo(formData) };
    }
    if (duplicate === "sku") {
      return { ok: false, fieldErrors: { sku: "aErrDuplicateSku" }, values: echo(formData) };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { ok: false, message: "aErrNotFound", fieldErrors: {}, values: echo(formData) };
    }
    console.error("saveProduct failed:", error instanceof Error ? error.message : error);
    return { ok: false, message: "aErrSaveFailed", fieldErrors: {}, values: echo(formData) };
  }

  revalidatePath("/admin/products");
  redirect(`/admin/products/${savedId}?notice=saved`);
}

/** Deletes a product, or deactivates it when orders still reference it. */
export async function deleteProduct(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/products");

  const orders = await prisma.orderItem.count({ where: { productId: id } });
  if (orders > 0) {
    await prisma.product.updateMany({ where: { id }, data: { isActive: false } });
    await audit(admin, "product.deactivate", "Product", id, { reason: "has orders" });
    redirect("/admin/products?notice=deactivated");
  }

  await prisma.product.deleteMany({ where: { id } });
  await audit(admin, "product.delete", "Product", id);
  redirect("/admin/products?notice=deleted");
}

export async function setProductActive(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  await prisma.product.updateMany({ where: { id }, data: { isActive: active } });
  await audit(admin, active ? "product.activate" : "product.deactivate", "Product", id);
  redirect(`/admin/products/${id}?notice=saved`);
}

// ------------------------------------------------------------------ inventory

export type StockState = { ok: boolean; message?: TranslationKey };

export async function adjustStock(
  _previous: StockState,
  formData: FormData,
): Promise<StockState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const mode = String(formData.get("mode") ?? "");
  const raw = String(formData.get("amount") ?? "").trim();

  if (!/^\d{1,6}$/.test(raw) || !["set", "add", "remove"].includes(mode)) {
    return { ok: false, message: "aErrStock" };
  }
  const amount = Number(raw);

  try {
    // Each variant is a single guarded UPDATE, so concurrent checkouts and
    // adjustments can never push stock below zero.
    const result =
      mode === "set"
        ? await prisma.product.updateMany({ where: { id }, data: { stock: amount } })
        : mode === "add"
          ? await prisma.product.updateMany({ where: { id }, data: { stock: { increment: amount } } })
          : await prisma.product.updateMany({
              where: { id, stock: { gte: amount } },
              data: { stock: { decrement: amount } },
            });
    if (result.count !== 1) {
      return { ok: false, message: mode === "remove" ? "aErrStockNegative" : "aErrNotFound" };
    }
  } catch (error) {
    console.error("adjustStock failed:", error instanceof Error ? error.message : error);
    return { ok: false, message: "aErrSaveFailed" };
  }

  await audit(admin, "stock.adjust", "Product", id, { mode, amount });
  revalidatePath("/admin/inventory");
  return { ok: true, message: "aNoticeStock" };
}

// --------------------------------------------------------------------- orders

export async function updateOrderStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const target = formData.get("status");
  if (!id || !isOrderStatus(target)) redirect("/admin/orders");

  const outcome = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return "missing" as const;
    if (!allowedTransitions[order.status].includes(target)) return "invalid" as const;

    // Only moves from the status we just read; a parallel change makes this 0.
    const changed = await tx.order.updateMany({
      where: { id, status: order.status },
      data: { status: target },
    });
    if (changed.count !== 1) return "conflict" as const;

    // A cancelled order puts its stock back, in the same transaction.
    if (target === "CANCELLED") {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }
    return { from: order.status } as const;
  });

  if (outcome === "missing") redirect("/admin/orders");
  if (outcome === "invalid" || outcome === "conflict") {
    redirect(`/admin/orders/${id}?notice=conflict`);
  }

  await audit(admin, "order.status", "Order", id, { from: outcome.from, to: target });
  revalidatePath("/admin/orders");
  redirect(`/admin/orders/${id}?notice=status`);
}
