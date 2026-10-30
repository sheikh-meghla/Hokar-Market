"use client";

import Link from "next/link";
import { useLanguage } from "../../components/language-provider";
import type { TranslationKey } from "@/lib/translations";

export type FilterField =
  | { kind: "search"; name: string; placeholder: TranslationKey }
  | {
      kind: "select";
      name: string;
      label: TranslationKey;
      options: { value: string; label: TranslationKey }[];
    }
  | { kind: "date"; name: string; label: TranslationKey };

/** GET form: filters live in the URL so pages stay server-rendered and shareable. */
export default function FilterBar({
  fields,
  values,
  resetHref,
}: {
  fields: FilterField[];
  values: Record<string, string>;
  resetHref: string;
}) {
  const { t } = useLanguage();
  const input =
    "w-full rounded-md border border-[#dfe6ec] bg-white px-3 py-2 text-sm outline-none focus:border-[#526d84]";

  return (
    <form
      method="get"
      className="mb-5 grid gap-3 rounded-xl border border-[#e3e9ee] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {fields.map((field) => (
        <label key={field.name} className="block text-xs">
          {field.kind !== "search" && (
            <span className="mb-1 block text-[#7e92a6]">{t(field.label)}</span>
          )}
          {field.kind === "search" && (
            <input
              type="search"
              name={field.name}
              defaultValue={values[field.name] ?? ""}
              placeholder={t(field.placeholder)}
              aria-label={t(field.placeholder)}
              className={input}
            />
          )}
          {field.kind === "select" && (
            <select
              name={field.name}
              defaultValue={values[field.name] ?? ""}
              className={input}
            >
              <option value="">{t("aAll")}</option>
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.label)}
                </option>
              ))}
            </select>
          )}
          {field.kind === "date" && (
            <input
              type="date"
              name={field.name}
              defaultValue={values[field.name] ?? ""}
              className={input}
            />
          )}
        </label>
      ))}
      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="rounded-md bg-[#526d84] px-4 py-2 text-sm font-medium text-white hover:bg-[#40576b]"
        >
          {t("aApply")}
        </button>
        <Link
          href={resetHref}
          className="rounded-md border border-[#d5dee6] px-4 py-2 text-sm hover:bg-[#f0f4f7]"
        >
          {t("aReset")}
        </Link>
      </div>
    </form>
  );
}
