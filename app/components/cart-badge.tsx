"use client";

import { useCart } from "@/lib/cart";
import { useLanguage } from "./language-provider";

/** Item-count bubble for the header cart link (place inside a `relative` parent). */
export default function CartBadge() {
  const { count } = useCart();
  const { formatNumber, t } = useLanguage();

  if (count === 0) return null;

  return (
    <span
      role="status"
      aria-label={t("cartCountLabel", { count: formatNumber(count) })}
      className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#526d84] px-1 text-[9px] font-semibold leading-none text-white"
    >
      {count > 99 ? "99+" : formatNumber(count)}
    </span>
  );
}
