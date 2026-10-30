"use client";

import { useLanguage } from "../../components/language-provider";
import type { TranslationKey } from "@/lib/translations";

// Small client components so server-rendered admin pages can show text, numbers
// and dates in the language currently chosen with the global language switcher.

export function T({
  k,
  params,
}: {
  k: TranslationKey;
  params?: Record<string, string | number>;
}) {
  const { t } = useLanguage();
  return <>{t(k, params)}</>;
}

export function Num({ value }: { value: number }) {
  const { formatNumber } = useLanguage();
  return <>{formatNumber(value)}</>;
}

export function Money({ value }: { value: number }) {
  const { formatNumber } = useLanguage();
  return <>৳{formatNumber(value)}</>;
}

export function DateText({
  iso,
  withTime = false,
}: {
  iso: string;
  withTime?: boolean;
}) {
  const { language } = useLanguage();
  const text = new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-BD", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: "Asia/Dhaka", // fixed so server and browser agree
  }).format(new Date(iso));
  return <>{text}</>;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-800",
  PAID: "bg-emerald-50 text-emerald-700",
  PROCESSING: "bg-sky-50 text-sky-700",
  SHIPPED: "bg-indigo-50 text-indigo-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-rose-50 text-rose-700",
  REFUNDED: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const key = `status${status}` as TranslationKey;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyles[status] ?? "bg-slate-100 text-slate-600"}`}
    >
      {t(key)}
    </span>
  );
}

const notices: Record<string, { key: TranslationKey; tone: "ok" | "warn" }> = {
  saved: { key: "aNoticeSaved", tone: "ok" },
  deleted: { key: "aNoticeDeleted", tone: "ok" },
  deactivated: { key: "aNoticeDeactivated", tone: "warn" },
  status: { key: "aNoticeStatus", tone: "ok" },
  stock: { key: "aNoticeStock", tone: "ok" },
  conflict: { key: "aNoticeConflict", tone: "warn" },
};

export function Notice({ code }: { code?: string }) {
  const { t } = useLanguage();
  const notice = code ? notices[code] : undefined;
  if (!notice) return null;
  return (
    <p
      role="status"
      className={`mb-4 rounded-md px-3 py-2.5 text-sm ${notice.tone === "ok" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"}`}
    >
      {t(notice.key)}
    </p>
  );
}
