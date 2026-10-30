"use client";

import Link from "next/link";
import { useLanguage } from "../components/language-provider";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";

export default function CatalogError({ reset }: { reset: () => void }) {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-white text-[#263e55]">
      <SiteHeader />
      <section
        role="alert"
        className="mx-auto my-16 max-w-lg rounded-xl border border-[#e5e8eb] bg-[#f8f9fa] px-5 py-14 text-center"
      >
        <h1 className="font-serif text-xl">{t("catalogError")}</h1>
        <p className="mt-2 text-sm text-[#7e92a6]">{t("catalogErrorText")}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-[#526d84] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#40576b]"
          >
            {t("catalogRetry")}
          </button>
          <Link
            href="/"
            className="rounded-md border border-[#91a4b5] px-6 py-3 text-sm transition hover:bg-[#f0f4f7]"
          >
            {t("catalogBrowse")}
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
