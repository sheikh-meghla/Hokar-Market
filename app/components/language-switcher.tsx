"use client";

import { useLanguage } from "./language-provider";
import type { Language } from "@/lib/translations";

const options: { value: Language; label: string }[] = [
  { value: "bn", label: "বাংলা" },
  { value: "en", label: "English" },
];

type LanguageSwitcherProps = {
  /** Stretch to the full width of the parent (e.g. inside a mobile menu). */
  fullWidth?: boolean;
};

export default function LanguageSwitcher({
  fullWidth = false,
}: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("languageSwitcherLabel")}
      className={`items-center gap-0.5 rounded-full border border-[#526d84]/30 bg-white p-0.5 shadow-sm ${
        fullWidth ? "flex w-full" : "inline-flex shrink-0"
      }`}
    >
      {options.map((option) => {
        const active = language === option.value;
        return (
          <button
            key={option.value}
            type="button"
            lang={option.value}
            aria-pressed={active}
            onClick={() => setLanguage(option.value)}
            style={
              option.value === "bn"
                ? { fontFamily: "var(--font-bengali), sans-serif" }
                : undefined
            }
            className={`rounded-full px-2.5 py-1.5 text-[10px] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526d84] focus-visible:ring-offset-1 sm:px-3 sm:text-[11px] ${
              fullWidth ? "flex-1 py-2" : ""
            } ${
              active
                ? "bg-[#526d84] text-white"
                : "bg-white text-[#526d84] hover:bg-[#edf0f3]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
