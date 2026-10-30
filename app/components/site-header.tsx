"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search, ShoppingCart } from "lucide-react";
import CartBadge from "./cart-badge";
import { useLanguage } from "./language-provider";
import LanguageSwitcher from "./language-switcher";

export default function SiteHeader() {
  const { t } = useLanguage();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <>
      {/* Top announcement */}
      <div className="bg-[#526d84] px-3 py-2 text-center text-[11px] text-white sm:text-xs">
        ✨ {t("announcement")} ✨
      </div>

      <header className="sticky top-0 z-40 border-b border-[#e7edf2] bg-white">
        <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#526d84] font-serif text-xl">
              C
            </span>
            <span>
              <span className="block font-serif text-[17px] font-semibold leading-tight">
                Hokar Market
              </span>
              <span className="block text-[8px] tracking-[2px] text-[#8495a6]">
                {t("brandTaglineShort")}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-5 text-[12px] lg:flex">
            <Link href="/" className="hover:text-[#8299ae]">{t("navHome")}</Link>
            <Link href="/ring" className="hover:text-[#8299ae]">{t("navRings")}</Link>
            <Link href="/necklace" className="hover:text-[#8299ae]">{t("navNecklaces")}</Link>
            <Link href="/bracelet" className="hover:text-[#8299ae]">{t("navBracelets")}</Link>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <LanguageSwitcher />
            <button
              aria-label={t("search")}
              className="hidden rounded-full p-2 hover:bg-[#f1f4f7] sm:block"
            >
              <Search size={17} />
            </button>
            <Link
              href="/cart"
              aria-label={t("shoppingCart")}
              className="relative rounded-full p-2 hover:bg-[#f1f4f7]"
            >
              <ShoppingCart size={18} />
              <CartBadge />
            </Link>
            <Link
              href="/login"
              className="hidden rounded-full border border-[#e0e7ed] px-4 py-2 text-xs sm:block"
            >
              {t("login")}
            </Link>
            <button
              aria-label={t("openMenu")}
              aria-expanded={mobileMenu}
              onClick={() => setMobileMenu(!mobileMenu)}
              className="rounded-full p-2 hover:bg-[#f1f4f7] lg:hidden"
            >
              <Menu size={19} />
            </button>
          </div>
        </div>

        {mobileMenu && (
          <nav className="grid gap-1 border-t border-[#e7edf2] bg-white p-4 text-sm lg:hidden">
            <Link className="rounded-md p-2 hover:bg-[#f1f4f7]" href="/">{t("navHome")}</Link>
            <Link className="rounded-md p-2 hover:bg-[#f1f4f7]" href="/ring">{t("navRings")}</Link>
            <Link className="rounded-md p-2 hover:bg-[#f1f4f7]" href="/necklace">{t("navNecklaces")}</Link>
            <Link className="rounded-md p-2 hover:bg-[#f1f4f7]" href="/bracelet">{t("navBracelets")}</Link>
            <Link className="rounded-md p-2 hover:bg-[#f1f4f7]" href="/login">{t("login")}</Link>
          </nav>
        )}
      </header>
    </>
  );
}
