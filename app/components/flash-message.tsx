"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { useLanguage } from "./language-provider";

const COOKIE = "cg_flash";

/** Shows a one-time success message set by a server action (see signUp). */
export default function FlashMessage() {
  const { t } = useLanguage();
  const [shown, setShown] = useState(false);
  // The layout survives client-side redirects, so re-check on every navigation.
  const pathname = usePathname();

  useEffect(() => {
    if (!document.cookie.split("; ").some((c) => c === `${COOKIE}=signup`)) return;
    // Consume the flag so a refresh does not show the message again.
    document.cookie = `${COOKIE}=; path=/; max-age=0`;
    const show = setTimeout(() => setShown(true), 0);
    const hide = setTimeout(() => setShown(false), 6000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [pathname]);

  if (!shown) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 top-4 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-800 shadow-lg"
    >
      <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
      <span className="flex-1">{t("uAccountCreated")}</span>
      <button
        type="button"
        onClick={() => setShown(false)}
        aria-label={t("aClose")}
        className="rounded p-1 hover:bg-emerald-50"
      >
        <X size={15} />
      </button>
    </div>
  );
}
