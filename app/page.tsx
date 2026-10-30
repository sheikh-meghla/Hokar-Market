"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "./components/language-provider";
import LanguageSwitcher from "./components/language-switcher";
import CartBadge from "./components/cart-badge";
import {
  categoryLabelKey,
  products as catalog,
  unsplash,
} from "@/lib/products";
import type { TranslationKey } from "@/lib/translations";
import {
  Search,
  UserRound,
  ShoppingBag,
  Heart,
  ArrowRight,
  ShieldCheck,
  Gift,
  Truck,
  Headset,
  ChevronRight,
  Menu,
} from "lucide-react";

const categories: {
  slug: string;
  label: TranslationKey;
  image: string;
}[] = [
  {
    slug: "necklace",
    label: "navNecklaces",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=500&q=85",
  },
  {
    slug: "bracelet",
    label: "navBracelets",
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=500&q=85",
  },
  {
    slug: "ring",
    label: "navRings",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=500&q=85",
  },
];

const benefits: {
  title: TranslationKey;
  description: TranslationKey;
  Icon: typeof ShieldCheck;
}[] = [
  { title: "benefitSecureTitle", description: "benefitSecureText", Icon: ShieldCheck },
  { title: "benefitGiftTitle", description: "benefitGiftText", Icon: Gift },
  { title: "benefitDeliveryTitle", description: "benefitDeliveryText", Icon: Truck },
  { title: "benefitSupportTitle", description: "benefitSupportText", Icon: Headset },
];

// The homepage features the first four catalog products.
const featuredProducts = catalog.slice(0, 4);

export default function Home() {
  const { t, l, formatNumber } = useLanguage();

  return (
    <main className="min-h-screen bg-white text-[#263f59]">
      {/* Announcement Bar */}
      <div className="flex h-8 items-center justify-center gap-2 bg-[#526d84] px-3 text-center text-[10px] text-white sm:text-xs">
        <ChevronRight size={12} className="rotate-180" />
        <span>{t("announcement")} ✦</span>
        <ChevronRight size={12} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-[66px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#526d84] font-serif text-xl">
              C
            </span>
            <span>
              <span className="block font-serif text-sm font-semibold sm:text-base">
                Hokar Market
              </span>
              <span className="block text-[8px] tracking-[0.2em] text-slate-500">
                {t("brandTaglineLong")}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-xs lg:flex">
            <Link href="/" className="transition hover:text-[#9a7952]">
              {t("navHome")}
            </Link>
            <Link href="/ring" className="transition hover:text-[#9a7952]">
              {t("navRings")}
            </Link>
            <Link href="/necklace" className="transition hover:text-[#9a7952]">
              {t("navNecklaces")}
            </Link>
            <Link href="/bracelet" className="transition hover:text-[#9a7952]">
              {t("navBracelets")}
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
            <LanguageSwitcher />

            <button
              type="button"
              aria-label={t("search")}
              className="transition hover:text-[#9a7952]"
            >
              <Search size={19} strokeWidth={1.6} />
            </button>

            <Link
              href="/login"
              aria-label={t("account")}
              className="transition hover:text-[#9a7952]"
            >
              <UserRound size={19} strokeWidth={1.6} />
            </Link>

            <Link
              href="/cart"
              aria-label={t("shoppingBag")}
              className="relative transition hover:text-[#9a7952]"
            >
              <ShoppingBag size={20} strokeWidth={1.6} />
              <CartBadge />
            </Link>

            <button
              type="button"
              aria-label={t("menu")}
              className="lg:hidden"
            >
              <Menu size={21} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <nav className="flex gap-5 overflow-x-auto border-t border-slate-100 px-4 py-2.5 text-[11px] lg:hidden">
          <Link href="/" className="shrink-0">{t("navHome")}</Link>
          <Link href="/ring" className="shrink-0">{t("navRings")}</Link>
          <Link href="/necklace" className="shrink-0">{t("navNecklaces")}</Link>
          <Link href="/bracelet" className="shrink-0">{t("navBracelets")}</Link>
        </nav>
      </header>

      {/* Hero Banner */}
      <section className="mx-auto grid max-w-7xl overflow-hidden bg-[#edf0f3] md:grid-cols-2">
        <div className="flex flex-col items-start justify-center px-6 py-8 sm:px-10 sm:py-10 lg:px-16">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.25em] text-[#526d84]">
            {t("heroEyebrow")}
          </p>

          <h1 className="max-w-md font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl">
            {t("heroTitleLine1")}
            <br />
            <span className="font-normal">{t("heroTitleLine2")}</span>
          </h1>

          <p className="mt-3 max-w-sm text-xs leading-6 text-slate-600 sm:text-sm">
            {t("heroText")}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 rounded-full bg-[#526d84] px-5 py-2.5 text-xs text-white transition hover:bg-[#344e66]"
            >
              {t("shopNow")}
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/collections"
              className="inline-flex items-center gap-2 rounded-full border border-[#526d84]/30 bg-white px-4 py-2.5 text-xs transition hover:bg-slate-50"
            >
              <Gift size={14} strokeWidth={1.6} />
              {t("giftCollection")}
            </Link>
          </div>
        </div>

        <div className="relative min-h-[210px] sm:min-h-[270px] md:min-h-[320px]">
          <Image
            src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1200&q=85"
            alt={t("heroImageAlt")}
            fill
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/${category.slug}`}
              className="group relative flex h-24 items-center overflow-hidden bg-[#f0f2f4] sm:h-32"
            >
              <div className="relative z-10 w-[60%] pl-3 sm:pl-6">
                <p className="font-serif text-sm sm:text-lg">
                  {t(category.label)}
                </p>
                <span className="mt-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition group-hover:bg-[#526d84] group-hover:text-white">
                  <ArrowRight size={13} />
                </span>
              </div>

              <div className="absolute inset-y-0 right-0 w-[52%]">
                <Image
                  src={category.image}
                  alt={t(category.label)}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 30vw, 200px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="mb-1 text-[9px] uppercase tracking-[0.25em] text-slate-500">
              {t("ourCollection")}
            </p>
            <h2 className="font-serif text-xl sm:text-2xl">
              {t("ourBestPicks")}
            </h2>
          </div>

          <Link
            href="/collections"
            className="inline-flex items-center gap-1 text-[10px] transition hover:text-[#9a7952]"
          >
            {t("viewAllProducts")}
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
          {featuredProducts.map((product) => (
            <article
              key={product.id}
              className="group min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-md"
            >
              <Link
                href={`/products/${product.slug}`}
                className="block"
              >
                <div className="relative aspect-[4/4.3] overflow-hidden bg-[#f0f1f2]">
                  <Image
                    src={unsplash(product.photos[0], 700)}
                    alt={l(product.name)}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />

                  {product.tag && (
                    <span className="absolute left-2 top-2 bg-[#526d84] px-2 py-1 text-[8px] tracking-wide text-white">
                      {t(product.tag)}
                    </span>
                  )}

                  <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition hover:text-rose-500">
                    <Heart size={16} strokeWidth={1.6} />
                  </span>
                </div>

                <div className="p-2.5 sm:p-3">
                  <p className="text-[8px] tracking-[0.15em] text-slate-500">
                    {t(categoryLabelKey[product.category]).toUpperCase()}
                  </p>

                  <h3 className="mt-1 line-clamp-2 min-h-9 text-xs font-medium leading-5 sm:text-sm">
                    {l(product.name)}
                  </h3>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold sm:text-sm">
                      ৳{formatNumber(product.price)}
                    </span>
                    <span className="text-[10px] text-slate-400 line-through">
                      ৳{formatNumber(product.oldPrice)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-[#edf0f3] px-2 py-2 text-[9px] transition group-hover:bg-[#526d84] group-hover:text-white sm:text-[10px]">
                    <ShoppingBag size={13} strokeWidth={1.7} />
                    <span>{t("viewProduct")}</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Gift Banner */}
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid min-h-36 overflow-hidden bg-[#edf0f3] sm:grid-cols-2">
          <div className="relative min-h-36">
            <Image
              src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&w=900&q=85"
              alt={t("homeGiftImageAlt")}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="flex flex-col items-start justify-center px-5 py-6 sm:px-8">
            <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500">
              {t("homeGiftEyebrow")}
            </p>

            <h2 className="mt-2 font-serif text-xl sm:text-2xl">
              {t("homeGiftTitle")}
            </h2>

            <p className="mt-2 text-xs text-slate-600">
              {t("homeGiftText")}
            </p>

            <Link
              href="/collections"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#526d84] px-5 py-2.5 text-[10px] text-white transition hover:bg-[#344e66]"
            >
              {t("homeGiftCta")}
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-4 sm:px-6 lg:px-8">
        {benefits.map(({ title, description, Icon }) => (
          <div
            key={title}
            className="border border-slate-200 px-3 py-5 text-center transition hover:border-[#526d84] hover:bg-slate-50"
          >
            <div className="flex justify-center text-[#526d84]">
              <Icon size={25} strokeWidth={1.5} />
            </div>
            <h3 className="mt-3 text-xs font-medium">{t(title)}</h3>
            <p className="mt-1 text-[9px] text-slate-500">{t(description)}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="bg-[#526d84] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white font-serif text-xl">
                C
              </span>
              <span className="font-serif text-lg">Hokar Market</span>
            </Link>

            <p className="mt-3 max-w-xs text-xs leading-6 text-slate-100">
              {t("footerTagline")}
            </p>

            <div className="mt-4 flex gap-3">
              <Link href="/contact" aria-label="Facebook" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 transition hover:bg-white hover:text-[#526d84]">
                f
              </Link>
              <Link href="/contact" aria-label="Instagram" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 transition hover:bg-white hover:text-[#526d84]">
                ◎
              </Link>
              <Link href="/contact" aria-label="Contact" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 transition hover:bg-white hover:text-[#526d84]">
                <Headset size={14} />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium">{t("footerQuickLinks")}</h3>
            <div className="flex flex-col gap-2 text-xs text-slate-100">
              <Link href="/">{t("navHome")}</Link>
              <Link href="/ring">{t("navRings")}</Link>
              <Link href="/cart">{t("shoppingBag")}</Link>
              <Link href="/login">{t("footerMyAccount")}</Link>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium">{t("footerCustomerService")}</h3>
            <div className="flex flex-col gap-2 text-xs text-slate-100">
              <Link href="/contact">{t("footerContact")}</Link>
              <Link href="/shipping">{t("footerShipping")}</Link>
              <Link href="/returns">{t("footerReturns")}</Link>
              <Link href="/privacy">{t("footerPrivacy")}</Link>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium">{t("footerNewsletterTitle")}</h3>
            <p className="mb-3 text-xs leading-5 text-slate-100">
              {t("footerNewsletterText")}
            </p>

            <form className="flex">
              <input
                type="email"
                placeholder={t("footerEmailPlaceholder")}
                aria-label={t("footerEmailLabel")}
                className="min-w-0 flex-1 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
              />
              <button
                type="button"
                aria-label={t("footerSubscribe")}
                className="bg-[#344e66] px-4 text-sm text-white transition hover:bg-[#263f59]"
              >
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/20">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-5 py-4 text-[10px] text-slate-100 sm:px-8">
            <p>{t("footerCopyright")}</p>
            <p className="inline-flex items-center gap-1">
              {t("madeWithCare")}
              <Heart size={11} />
              {t("inBangladesh")}
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
