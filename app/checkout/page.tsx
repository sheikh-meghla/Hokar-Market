"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { lineKey, useCart, useHydrated } from "@/lib/cart";
import type {
  CustomerField,
  CustomerInput,
  FieldErrors,
  LineIssue,
  LineProblem,
  VerifiedLine,
} from "@/lib/order";
import type { TranslationKey } from "@/lib/translations";
import { useLanguage } from "../components/language-provider";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import { placeOrder, quoteOrder } from "./actions";

const emptyForm: CustomerInput = {
  fullName: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  deliveryNote: "",
};

const fields: {
  name: Exclude<CustomerField, "deliveryNote">;
  label: TranslationKey;
  autoComplete: string;
  inputMode?: "tel" | "numeric";
  hint?: TranslationKey;
  wide?: boolean;
}[] = [
  { name: "fullName", label: "coFullName", autoComplete: "name", wide: true },
  {
    name: "phone",
    label: "coPhone",
    autoComplete: "tel",
    inputMode: "tel",
    hint: "coPhoneHint",
    wide: true,
  },
  { name: "address", label: "coAddress", autoComplete: "street-address", wide: true },
  { name: "city", label: "coCity", autoComplete: "address-level2" },
  {
    name: "postalCode",
    label: "coPostal",
    autoComplete: "postal-code",
    inputMode: "numeric",
  },
];

const issueKeys: Record<LineIssue, TranslationKey> = {
  unavailable: "coIssueUnavailable",
  outOfStock: "coIssueOutOfStock",
  invalidSize: "coIssueInvalid",
  invalidColor: "coIssueInvalid",
  invalidQuantity: "coIssueInvalid",
};

export default function CheckoutPage() {
  const { selectedItems, removeLines } = useCart();
  const hydrated = useHydrated();
  const { t, l, formatNumber } = useLanguage();
  const router = useRouter();

  const [lines, setLines] = useState<VerifiedLine[] | null>(null);
  const [problems, setProblems] = useState<LineProblem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState<CustomerInput>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<TranslationKey | null>(null);
  const [pending, setPending] = useState(false);
  const [placed, setPlaced] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  // Only what identifies a line is sent; the server looks up price and name.
  const selectionJson = useMemo(
    () =>
      JSON.stringify(
        selectedItems.map(({ id, color, size, quantity }) => ({
          id,
          color,
          size,
          quantity,
        })),
      ),
    [selectedItems],
  );

  useEffect(() => {
    if (!hydrated || placed) return;
    const selection: unknown[] = JSON.parse(selectionJson);
    if (selection.length === 0) return;

    let cancelled = false;
    quoteOrder(selection)
      .then((quote) => {
        if (cancelled) return;
        setLines(quote.lines);
        setProblems(quote.problems);
        setSubtotal(quote.subtotal);
        setShippingFee(quote.shippingFee);
        setTotal(quote.total);
      })
      .catch(() => {
        if (!cancelled) setFormError("coError");
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, placed, selectionJson]);

  const problemByKey = new Map(problems.map((p) => [p.key, p.issue]));
  const cartNameByKey = new Map(
    selectedItems.map((item) => [
      lineKey(item),
      l({ en: item.name, bn: item.nameBn ?? item.name }),
    ]),
  );

  function fieldMessage(name: CustomerField) {
    const error = fieldErrors[name];
    if (!error) return null;
    if (error === "required") return t("coErrRequired");
    if (name === "phone") return t("coErrPhone");
    if (name === "postalCode") return t("coErrPostal");
    return t("coErrInvalid");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || placed) return;

    idempotencyKey.current ??= crypto.randomUUID();
    setPending(true);
    setFormError(null);

    try {
      const result = await placeOrder({
        idempotencyKey: idempotencyKey.current,
        lines: JSON.parse(selectionJson),
        customer: form,
      });

      if (result.ok) {
        // The order is saved. Only the ordered lines leave the cart; unselected
        // ones stay. The confirmation page reads the order back from the database.
        setPlaced(true);
        removeLines(result.orderedKeys);
        router.replace(
          `/orders/${encodeURIComponent(result.orderNumber)}?token=${encodeURIComponent(result.accessToken)}`,
        );
        return;
      }

      if (result.reason === "error") {
        setFormError("coError");
        return;
      }

      setLines(result.lines);
      setProblems(result.problems);
      setSubtotal(result.subtotal);
      setShippingFee(result.shippingFee);
      setTotal(result.total);
      setFieldErrors(result.fieldErrors);
      if (result.reason === "lines") setFormError("coFixCart");
    } catch {
      setFormError("coError");
    } finally {
      setPending(false);
    }
  }

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-[#f8f9fa] text-[#263746]">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </div>
      <SiteFooter />
    </main>
  );

  if (!hydrated) {
    return shell(
      <p className="py-24 text-center text-sm text-slate-500">
        {t("cartLoading")}
      </p>,
    );
  }

  if (placed) {
    return shell(
      <p role="status" className="py-24 text-center text-sm text-slate-500">
        {t("coPlacing")}
      </p>,
    );
  }

  if (selectedItems.length === 0) {
    return shell(
      <section className="mx-auto max-w-lg rounded-xl border border-[#e5e8eb] bg-white px-5 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f4f6] text-[#526d84]">
          <ShoppingBag size={24} strokeWidth={1.6} />
        </div>
        <h1 className="mt-5 font-serif text-xl font-semibold">
          {t("coNoSelection")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{t("coNoSelectionText")}</p>
        <Link
          href="/cart"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-[#526d84] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#40576b]"
        >
          {t("coBackToCart")}
        </Link>
      </section>,
    );
  }

  const canSubmit = !pending && lines !== null && problems.length === 0;

  return shell(
    <>
      <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-[#e7eaed] pb-4">
        <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("coTitle")}
        </h1>
        <Link href="/cart" className="text-sm font-medium text-[#526d84] hover:underline">
          ← {t("coBackToCart")}
        </Link>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-xl border border-[#e5e8eb] bg-white p-5 sm:p-6"
        >
          <h2 className="font-serif text-lg font-semibold">{t("coDetails")}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {t("uCheckoutSignIn")}{" "}
            <Link href="/login?next=/checkout" className="font-medium text-[#526d84] underline">
              {t("uSignIn")}
            </Link>
            {" · "}
            <Link href="/signup?next=/checkout" className="font-medium text-[#526d84] underline">
              {t("uSignUp")}
            </Link>
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const message = fieldMessage(field.name);
              const id = `checkout-${field.name}`;
              return (
                <div key={field.name} className={field.wide ? "sm:col-span-2" : ""}>
                  <label htmlFor={id} className="mb-1.5 block text-xs font-medium">
                    {t(field.label)}
                  </label>
                  <input
                    id={id}
                    name={field.name}
                    value={form[field.name]}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        [field.name]: event.target.value,
                      }));
                      setFieldErrors((current) => ({
                        ...current,
                        [field.name]: undefined,
                      }));
                    }}
                    autoComplete={field.autoComplete}
                    inputMode={field.inputMode}
                    placeholder={field.hint ? t(field.hint) : undefined}
                    aria-invalid={message ? true : undefined}
                    aria-describedby={message ? `${id}-error` : undefined}
                    className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#526d84] ${
                      message ? "border-rose-400" : "border-[#dfe6ec]"
                    }`}
                  />
                  {message && (
                    <p id={`${id}-error`} className="mt-1 text-xs text-rose-600">
                      {message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <label htmlFor="checkout-deliveryNote" className="mb-1.5 block text-xs font-medium">
              {t("coNote")}
            </label>
            <textarea
              id="checkout-deliveryNote"
              name="deliveryNote"
              rows={3}
              maxLength={300}
              value={form.deliveryNote}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  deliveryNote: event.target.value,
                }))
              }
              className="w-full rounded-md border border-[#dfe6ec] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#526d84]"
            />
          </div>

          <div className="mt-5 rounded-md border border-[#526d84] bg-[#f6f9fb] p-3 text-sm">
            <p className="text-xs text-slate-500">{t("coPaymentMethod")}</p>
            <p className="mt-0.5 font-medium">{t("coCod")}</p>
          </div>

          {formError && (
            <p role="alert" className="mt-5 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              {t(formError)}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-md bg-[#526d84] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#40576b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? t("coPlacing") : t("coPlace")}
          </button>
        </form>

        <aside className="rounded-xl border border-[#e5e8eb] bg-white p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="font-serif text-lg font-semibold">{t("coSummary")}</h2>

          {lines === null ? (
            <p className="mt-5 text-sm text-slate-500">{t("coVerifying")}</p>
          ) : (
            <>
              <ul className="mt-5 divide-y divide-[#edf0f2]">
                {lines.map((line) => (
                  <li key={line.key} className="flex gap-3 py-3">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#f2f3f4] text-slate-400">
                      {line.image ? (
                        <Image
                          src={line.image}
                          alt={l(line.name)}
                          fill
                          unoptimized
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <ShoppingBag size={20} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="break-words font-medium">{l(line.name)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {t("coQty")}: {formatNumber(line.quantity)} · ৳
                        {formatNumber(line.unitPrice)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">
                      ৳{formatNumber(line.lineTotal)}
                    </span>
                  </li>
                ))}

                {problems.map((problem) => (
                  <li key={problem.key} className="py-3 text-sm">
                    <p className="font-medium">
                      {cartNameByKey.get(problem.key)}
                    </p>
                    <p role="alert" className="mt-0.5 text-xs text-rose-600">
                      {t(issueKeys[problemByKey.get(problem.key) ?? problem.issue])}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-3 border-t border-[#edf0f2] pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">{t("cartSelectedProducts")}</span>
                  <span className="font-medium">
                    {formatNumber(lines.length + problems.length)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">{t("cartSubtotal")}</span>
                  <span className="font-medium">৳{formatNumber(subtotal)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">{t("cartDelivery")}</span>
                  <span className="font-medium">
                    ৳{formatNumber(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between gap-3 border-t border-[#edf0f2] pt-3">
                  <span className="font-semibold">{t("cartTotal")}</span>
                  <span className="text-lg font-semibold text-[#526d84]">
                    ৳{formatNumber(total)}
                  </span>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </>,
  );
}
