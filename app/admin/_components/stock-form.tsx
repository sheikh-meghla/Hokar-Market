"use client";

import { useActionState } from "react";
import { adjustStock, type StockState } from "../actions";
import { useLanguage } from "../../components/language-provider";

export default function StockForm({ id }: { id: string }) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState<StockState, FormData>(adjustStock, { ok: false });

  return (
    <form action={action} className="flex flex-wrap items-center justify-end gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="mode"
        aria-label={t("aStockMode")}
        className="rounded-md border border-[#dfe6ec] bg-white px-2 py-1.5 text-xs"
        defaultValue="add"
      >
        <option value="add">{t("aStockAdd")}</option>
        <option value="remove">{t("aStockRemove")}</option>
        <option value="set">{t("aStockSet")}</option>
      </select>
      <input
        name="amount"
        inputMode="numeric"
        aria-label={t("aStockAmount")}
        placeholder="0"
        className="w-20 rounded-md border border-[#dfe6ec] px-2 py-1.5 text-xs"
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[#526d84] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#40576b] disabled:opacity-60"
      >
        {t("aApply")}
      </button>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`w-full text-right text-[11px] ${state.ok ? "text-green-700" : "text-rose-600"}`}
        >
          {t(state.message)}
        </p>
      )}
    </form>
  );
}
