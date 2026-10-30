"use client";

import Link from "next/link";
import { useLanguage } from "./language-provider";

export default function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="bg-[#526d84] text-white">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-x-6 gap-y-8 px-5 py-9 sm:px-6 md:grid-cols-4 md:gap-8">
        <div>
          <Link href="/" className="mb-3 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 font-serif text-lg">
              C
            </span>
            <span>
              <span className="block font-serif text-base">Hokar Market</span>
              <span className="block text-[8px] tracking-[2px] text-white/70">
                {t("brandTaglineShort")}
              </span>
            </span>
          </Link>
          <p className="max-w-xs text-[10px] leading-5 text-white/75">
            {t("footerTagline")}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-[11px] font-medium">{t("footerQuickLinks")}</h3>
          <div className="space-y-2.5 text-[10px] text-white/75">
            <p><Link href="/">{t("navHome")}</Link></p>
            <p><Link href="/ring">{t("navRings")}</Link></p>
            <p><Link href="/necklace">{t("navNecklaces")}</Link></p>
            <p><Link href="/bracelet">{t("navBracelets")}</Link></p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-[11px] font-medium">{t("footerCustomerService")}</h3>
          <div className="space-y-2.5 text-[10px] text-white/75">
            <p><Link href="/contact">{t("footerContact")}</Link></p>
            <p><Link href="/shipping">{t("footerShipping")}</Link></p>
            <p><Link href="/returns">{t("footerReturns")}</Link></p>
            <p><Link href="/privacy">{t("footerPrivacy")}</Link></p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-[11px] font-medium">{t("footerNewsletterTitle")}</h3>
          <p className="mb-3 text-[10px] leading-5 text-white/75">
            {t("footerNewsletterText")}
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              alert(t("footerNewsletterNotice"));
            }}
            className="flex overflow-hidden rounded bg-white"
          >
            <input
              type="email"
              required
              placeholder={t("footerEmailPlaceholder")}
              aria-label={t("footerEmailLabel")}
              className="min-w-0 flex-1 px-2.5 py-2.5 text-[10px] text-[#263e55] outline-none"
            />
            <button
              type="submit"
              aria-label={t("footerSubscribe")}
              className="bg-[#344f66] px-3 text-white hover:bg-[#243f56]"
            >
              →
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-2 px-5 py-3 text-[9px] text-white/75 sm:flex-row sm:px-6">
          <p>{t("footerCopyright")}</p>
          <p>{t("bangladesh")} · {t("madeWithCare")} ♡</p>
        </div>
      </div>
    </footer>
  );
}
