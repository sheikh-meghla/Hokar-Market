"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useLanguage } from "../../components/language-provider";
import SiteFooter from "../../components/site-footer";
import SiteHeader from "../../components/site-header";
import type { Localized, TranslationKey } from "@/lib/translations";

export type OrderView = {
  orderNumber: string;
  createdAt: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  deliveryNote: string | null;
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: {
    id: string;
    slug: string;
    name: Localized;
    image: string | null;
    size: string | null;
    color: string | null;
    quantity: number;
    price: number;
  }[];
};

const colorLabels: Record<string, TranslationKey> = {
  Gold: "colorGold",
  Silver: "colorSilver",
  "Rose Gold": "colorRoseGold",
};

export default function OrderConfirmation({ order }: { order: OrderView }) {
  const { language, t, l, formatNumber } = useLanguage();

  const date = new Intl.DateTimeFormat(language === "bn" ? "bn-BD" : "en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dhaka", // fixed so server and browser render the same text
  }).format(new Date(order.createdAt));

  const statusKey = `status${order.status}` as TranslationKey;

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-[#263746]">
      <SiteHeader />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        <section className="rounded-xl border border-[#e5e8eb] bg-white p-5 sm:p-8">
          <div className="text-center">
            <CheckCircle2
              className="mx-auto text-[#39b76a]"
              size={44}
              strokeWidth={1.5}
            />
            <h1 className="mt-4 font-serif text-2xl font-semibold">
              {t("coSuccessTitle")}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {t("coOrderNumber")}:{" "}
              <span className="font-semibold text-[#263746]">
                {order.orderNumber}
              </span>
            </p>
          </div>

          <dl className="mt-6 grid gap-4 border-y border-[#edf0f2] py-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-slate-500">{t("ocDate")}</dt>
              <dd className="mt-1 font-medium">{date}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{t("ocStatus")}</dt>
              <dd className="mt-1 font-medium">
                {translationExists(statusKey) ? t(statusKey) : order.status}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{t("coPaymentMethod")}</dt>
              <dd className="mt-1 font-medium">{t("coCod")}</dd>
            </div>
          </dl>

          <ul className="divide-y divide-[#edf0f2]">
            {order.items.map((item) => {
              const name = l(item.name);
              const details = [
                item.color &&
                  `${t("color")}: ${colorLabels[item.color] ? t(colorLabels[item.color]) : item.color}`,
                item.size && `${t("size")}: ${formatNumber(Number(item.size))}`,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <li key={item.id} className="flex gap-3 py-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#f2f3f4] text-slate-400">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={name}
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
                    <Link
                      href={`/products/${item.slug}`}
                      className="break-words font-medium hover:text-[#526d84]"
                    >
                      {name}
                    </Link>
                    {details && (
                      <p className="mt-0.5 text-xs text-slate-500">{details}</p>
                    )}
                    <p className="mt-0.5 text-xs text-slate-500">
                      {t("coQty")}: {formatNumber(item.quantity)} · ৳
                      {formatNumber(item.price)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    ৳{formatNumber(item.price * item.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="space-y-3 border-t border-[#edf0f2] pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">{t("cartSubtotal")}</span>
              <span className="font-medium">৳{formatNumber(order.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">{t("cartDelivery")}</span>
              <span className="font-medium">৳{formatNumber(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-[#edf0f2] pt-3">
              <span className="font-semibold">{t("cartTotal")}</span>
              <span className="text-lg font-semibold text-[#526d84]">
                ৳{formatNumber(order.total)}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-md bg-[#f8f9fa] p-4 text-sm">
            <h2 className="mb-2 text-xs font-medium text-slate-500">
              {t("ocDelivery")}
            </h2>
            <p className="font-medium">{order.customer.name}</p>
            <p>{order.customer.phone}</p>
            <p>
              {order.customer.address}, {order.customer.city}{" "}
              {order.customer.postalCode}, {order.customer.country}
            </p>
            {order.deliveryNote && (
              <p className="mt-2 text-xs text-slate-500">{order.deliveryNote}</p>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            {t("coStayNote")}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/cart"
              className="rounded-md border border-[#91a4b5] px-5 py-3 text-center text-sm transition hover:bg-[#f0f4f7]"
            >
              {t("coViewCart")}
            </Link>
            <Link
              href="/"
              className="rounded-md bg-[#526d84] px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-[#40576b]"
            >
              {t("coContinue")}
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}

const knownStatuses = new Set([
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

function translationExists(key: string) {
  return knownStatuses.has(key.replace("status", ""));
}
