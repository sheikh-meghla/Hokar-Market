"use client";

import { useLanguage } from "../../components/language-provider";

export default function AdminError({ reset }: { reset: () => void }) {
  const { t } = useLanguage();
  return (
    <section role="alert" className="mx-auto mt-10 max-w-md rounded-xl border border-[#e3e9ee] bg-white p-8 text-center">
      <h1 className="font-serif text-xl">{t("aErrLoad")}</h1>
      <p className="mt-2 text-sm text-[#6c8195]">{t("aErrLoadText")}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-md bg-[#526d84] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#40576b]"
      >
        {t("catalogRetry")}
      </button>
    </section>
  );
}
