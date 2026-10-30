"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "../generated/prisma/client";
import { createSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { safeReturnTo } from "@/lib/safe-redirect";
import type { TranslationKey } from "@/lib/translations";

export type AuthField = "name" | "email" | "phone" | "password" | "confirm";

export type AuthState = {
  error?: TranslationKey;
  fieldErrors?: Partial<Record<AuthField, TranslationKey>>;
  /** Echoed back (never the passwords) so a failed submit keeps what was typed. */
  values?: { name?: string; email?: string; phone?: string };
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

function safeNext(value: FormDataEntryValue | null) {
  return safeReturnTo(value);
}

// Best-effort brute-force limit per client address (per server instance).
const attempts = new Map<string, { count: number; since: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8; // sign-in failures per window
const MAX_SIGNUPS = 20; // sign-ups per window (shared networks are common)

async function clientKey(scope: string) {
  const forwarded = (await headers()).get("x-forwarded-for");
  return `${scope}:${forwarded?.split(",")[0]?.trim() || "local"}`;
}
function isLocked(key: string, max = MAX_ATTEMPTS) {
  const entry = attempts.get(key);
  if (entry && Date.now() - entry.since > WINDOW_MS) attempts.delete(key);
  return (attempts.get(key)?.count ?? 0) >= max;
}
function recordFailure(key: string) {
  const entry = attempts.get(key) ?? { count: 0, since: Date.now() };
  attempts.set(key, { count: entry.count + 1, since: entry.since });
}

const DUMMY_HASH = "scrypt$00000000000000000000000000000000$" + "0".repeat(128);

export async function signUp(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim().replace(/[\s-]/g, "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const values = { name, email, phone };

  const fieldErrors: AuthState["fieldErrors"] = {};
  if (name.length < 2 || name.length > 100) fieldErrors.name = "uErrName";
  if (!EMAIL.test(email) || email.length > 254) fieldErrors.email = "uErrEmail";
  if (phone && !PHONE.test(phone)) fieldErrors.phone = "uErrPhone";
  if (
    password.length < 8 ||
    password.length > 200 ||
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    fieldErrors.password = "uErrPassword";
  }
  if (password !== confirm) fieldErrors.confirm = "uErrMismatch";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const key = await clientKey("signup");
  if (isLocked(key, MAX_SIGNUPS)) return { error: "uErrLocked", values };
  recordFailure(key); // sign-ups are limited too; cleared only by the window

  let userId: string;
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash: await hashPassword(password),
        role: "CUSTOMER", // never taken from the form
      },
      select: { id: true },
    });
    userId = user.id;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { fieldErrors: { email: "uErrDuplicate" }, values };
    }
    console.error("signUp failed:", error instanceof Error ? error.message : error);
    return { error: "uErrFailed", values };
  }

  await createSession(userId);
  // One-minute flag so the next page can say the account was created. It is
  // readable by the page script on purpose and carries no secret.
  (await cookies()).set("cg_flash", "signup", { path: "/", maxAge: 60, sameSite: "lax" });
  redirect(safeNext(formData.get("next")));
}

export async function signIn(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const values = { email };

  const key = await clientKey("signin");
  if (isLocked(key)) return { error: "uErrLocked", values };

  const user =
    email.length > 0 && email.length <= 254
      ? await prisma.user.findUnique({ where: { email } })
      : null;
  // Always hash-compare so timing does not reveal whether the email exists.
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid) {
    recordFailure(key);
    return { error: "uErrCredentials", values };
  }

  attempts.delete(key);
  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : safeNext(formData.get("next")));
}
