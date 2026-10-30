"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { lineKey, useCart, useHydrated, type CartItem } from "@/lib/cart";
import { useLanguage } from "../components/language-provider";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import type { TranslationKey } from "@/lib/translations";

const colorLabels: Record<string, TranslationKey> = {
  Gold: "colorGold",
  Silver: "colorSilver",
  "Rose Gold": "colorRoseGold",
};

export default function CartPage() {
  const {
    items,
    count,
    selectedItems,
    selectedSubtotal,
    setQuantity,
    removeItem,
    setSelected,
    setAllSelected,
  } = useCart();
  const hydrated = useHydrated();
  const { language, t, formatNumber } = useLanguage();

  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const hasSelection = selectedItems.length > 0;

  const itemName = (item: CartItem) =>
    language === "bn" && item.nameBn ? item.nameBn : item.name;

  const variantText = (item: CartItem) => {
    const parts: string[] = [];
    if (item.color) {
      const label = colorLabels[item.color];
      parts.push(`${t("color")}: ${label ? t(label) : item.color}`);
    }
    if (item.size) {
      const size = Number(item.size);
      parts.push(
        `${t("size")}: ${Number.isNaN(size) ? item.size : formatNumber(size)}`,
      );
    }
    return parts.join(" · ");
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-[#263746]">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {!hydrated ? (
          <p className="py-24 text-center text-sm text-slate-500">
            {t("cartLoading")}
          </p>
        ) : items.length === 0 ? (
          <section className="mx-auto max-w-lg rounded-xl border border-[#e5e8eb] bg-white px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f4f6] text-[#526d84]">
              <ShoppingBag size={24} strokeWidth={1.6} />
            </div>
            <h1 className="mt-5 font-serif text-xl font-semibold">
              {t("cartEmpty")}
            </h1>
            <p className="mt-2 text-sm text-slate-500">{t("cartEmptyText")}</p>
            <Link
              href="/collections"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-[#526d84] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#40576b]"
            >
              {t("cartExplore")}
            </Link>
          </section>
        ) : (
          <>
            <div className="mb-6 flex items-baseline justify-between gap-4 border-b border-[#e7eaed] pb-4">
              <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("cartTitle")}
              </h1>
              <span className="text-sm text-slate-500">
                {count === 1
                  ? t("cartItemsOne")
                  : t("cartItemsCount", { count: formatNumber(count) })}
              </span>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
              <section className="overflow-hidden rounded-xl border border-[#e5e8eb] bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-[#edf0f2] bg-[#f8f9fa] px-4 py-3 sm:px-6">
                  <label className="flex min-h-8 cursor-pointer items-center gap-3 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(event) => setAllSelected(event.target.checked)}
                      className="h-5 w-5 cursor-pointer accent-[#526d84]"
                    />
                    {t("cartSelectAll")}
                  </label>
                  <span className="text-xs text-slate-500">
                    {t("cartSelectedOf", {
                      selected: formatNumber(selectedItems.length),
                      total: formatNumber(items.length),
                    })}
                  </span>
                </div>

                <ul className="divide-y divide-[#edf0f2]">
                  {items.map((item) => {
                    const key = lineKey(item);
                    const name = itemName(item);
                    const variant = variantText(item);
                    const productHref = item.slug
                      ? `/products/${item.slug}`
                      : undefined;

                    const image = (
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[#f2f3f4] sm:h-28 sm:w-28">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={name}
                            fill
                            unoptimized
                            sizes="112px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">
                            <ShoppingBag size={22} strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                    );

                    return (
                      <li
                        key={key}
                        className={`grid gap-4 border-l-4 px-4 py-5 transition-colors sm:grid-cols-[minmax(0,1fr)_auto_96px] sm:items-center sm:gap-6 sm:px-6 ${
                          item.selected
                            ? "border-[#526d84] bg-[#f6f9fb]"
                            : "border-transparent"
                        }`}
                      >
                        <div className="flex min-w-0 gap-3 sm:gap-4">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(event) =>
                              setSelected(key, event.target.checked)
                            }
                            aria-label={t("cartSelectItem", { name })}
                            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[#526d84] sm:mt-0 sm:self-center"
                          />
                          {productHref ? (
                            <Link href={productHref} aria-label={name}>
                              {image}
                            </Link>
                          ) : (
                            image
                          )}

                          <div
                            className={`min-w-0 py-1 ${item.selected ? "" : "text-slate-500"}`}
                          >
                            <h2 className="break-words text-sm font-semibold sm:text-base">
                              {productHref ? (
                                <Link
                                  href={productHref}
                                  className="hover:text-[#526d84]"
                                >
                                  {name}
                                </Link>
                              ) : (
                                name
                              )}
                            </h2>
                            {variant && (
                              <p className="mt-1 text-xs text-slate-500">
                                {variant}
                              </p>
                            )}
                            <p className="mt-2 text-sm text-slate-600">
                              ৳{formatNumber(item.price)}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeItem(key)}
                              aria-label={t("cartRemoveItem", { name })}
                              className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#a16c65] hover:underline"
                            >
                              <Trash2 size={13} />
                              {t("cartRemove")}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-center">
                          <span className="text-xs text-slate-500 sm:hidden">
                            {t("quantity")}
                          </span>
                          <div className="flex h-9 items-center rounded-md border border-[#e1e5e8]">
                            <button
                              type="button"
                              onClick={() =>
                                setQuantity(key, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                              aria-label={t("cartDecreaseItem", { name })}
                              className="flex h-9 w-9 items-center justify-center text-[#526d84] hover:bg-slate-50 disabled:opacity-40"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="min-w-8 text-center text-sm">
                              {formatNumber(item.quantity)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setQuantity(key, item.quantity + 1)
                              }
                              aria-label={t("cartIncreaseItem", { name })}
                              className="flex h-9 w-9 items-center justify-center text-[#526d84] hover:bg-slate-50"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end">
                          <span className="text-xs text-slate-500 sm:hidden">
                            {t("cartSubtotal")}
                          </span>
                          <span className="text-sm font-semibold">
                            ৳{formatNumber(item.price * item.quantity)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="border-t border-[#edf0f2] px-5 py-4 sm:px-6">
                  <Link
                    href="/collections"
                    className="text-sm font-medium text-[#526d84] hover:underline"
                  >
                    ← {t("cartContinue")}
                  </Link>
                </div>
              </section>

              <aside className="rounded-xl border border-[#e5e8eb] bg-white p-5 sm:p-6 lg:sticky lg:top-24">
                <h2 className="font-serif text-lg font-semibold">
                  {t("cartSummary")}
                </h2>

                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">
                      {t("cartSelectedProducts")}
                    </span>
                    <span className="font-medium">
                      {formatNumber(selectedItems.length)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">
                      {t("cartSelectedSubtotal")}
                    </span>
                    <span className="font-medium">
                      ৳{formatNumber(selectedSubtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500">{t("cartDelivery")}</span>
                    <span className="max-w-[160px] text-right text-xs text-slate-500">
                      {t("cartDeliveryNote")}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 border-t border-[#edf0f2] pt-4">
                    <span className="font-semibold">{t("cartTotal")}</span>
                    <span className="text-lg font-semibold text-[#526d84]">
                      ৳{formatNumber(selectedSubtotal)}
                    </span>
                  </div>
                </div>

                {hasSelection ? (
                  <Link
                    href="/checkout"
                    className="mt-6 flex min-h-12 w-full items-center justify-center rounded-md bg-[#526d84] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#40576b]"
                  >
                    {t("cartOrderSelected")} →
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled
                      className="mt-6 flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-md bg-[#526d84] px-4 py-3 text-sm font-semibold text-white opacity-40"
                    >
                      {t("cartOrderSelected")} →
                    </button>
                    <p role="status" className="mt-3 text-center text-xs text-amber-700">
                      {t("cartSelectToOrder")}
                    </p>
                  </>
                )}
              </aside>
            </div>
          </>
        )}
      </div>

      <SiteFooter />
    </main>
  );
}
