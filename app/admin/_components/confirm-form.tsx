"use client";

import { useRef } from "react";
import { useLanguage } from "../../components/language-provider";
import type { TranslationKey } from "@/lib/translations";

/**
 * A button that asks for confirmation in a dialog before submitting a server
 * action. `fields` are sent as hidden inputs.
 */
export default function ConfirmForm({
  action,
  fields,
  label,
  title,
  message,
  danger = false,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: TranslationKey;
  title: TranslationKey;
  message: TranslationKey;
  danger?: boolean;
}) {
  const { t } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={`rounded-md border px-3 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526d84] ${
          danger
            ? "border-rose-200 text-rose-700 hover:bg-rose-50"
            : "border-[#d5dee6] text-[#526d84] hover:bg-[#f0f4f7]"
        }`}
      >
        {t(label)}
      </button>

      <dialog
        ref={dialog}
        className="m-auto w-[min(92vw,26rem)] rounded-xl p-0 shadow-xl backdrop:bg-black/40"
        aria-labelledby="confirm-title"
      >
        <form action={action} onSubmit={() => dialog.current?.close()} className="p-5">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <h2 id="confirm-title" className="font-serif text-lg">
            {t(title)}
          </h2>
          <p className="mt-2 text-sm text-[#6c8195]">{t(message)}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="rounded-md border border-[#d5dee6] px-4 py-2 text-sm hover:bg-[#f0f4f7]"
            >
              {t("aCancel")}
            </button>
            <button
              type="submit"
              className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                danger ? "bg-rose-600 hover:bg-rose-700" : "bg-[#526d84] hover:bg-[#40576b]"
              }`}
            >
              {t("aConfirm")}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
