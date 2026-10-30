"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveProduct } from "../actions";
import { useLanguage } from "../../components/language-provider";
import type { ProductField, ProductFormState } from "@/lib/admin-product";
import type { TranslationKey } from "@/lib/translations";

export type ProductFormValues = {
  id?: string;
  name: string;
  nameBn: string;
  slug: string;
  sku: string;
  description: string;
  descriptionBn: string;
  category: string;
  gender: string;
  price: string;
  oldPrice: string;
  stock: string;
  sizes: string;
  colors: string;
  images: string;
  isActive: boolean;
};

export const emptyProduct: ProductFormValues = {
  name: "", nameBn: "", slug: "", sku: "", description: "", descriptionBn: "",
  category: "", gender: "", price: "", oldPrice: "", stock: "0",
  sizes: "", colors: "", images: "", isActive: true,
};

type FieldProps = {
  name: ProductField;
  label: TranslationKey;
  hint?: TranslationKey;
  error?: TranslationKey;
  t: (key: TranslationKey) => string;
  children: React.ReactNode;
};

function FieldBox({ name, label, hint, error, t, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="mb-1.5 block text-xs font-medium">
        {t(label)}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-[#7e92a6]">{t(hint)}</p>}
      {error && (
        <p id={`f-${name}-error`} className="mt-1 text-xs text-rose-600">
          {t(error)}
        </p>
      )}
    </div>
  );
}

export default function ProductForm({ initial }: { initial: ProductFormValues }) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState<ProductFormState, FormData>(
    saveProduct,
    { ok: false, fieldErrors: {} },
  );

  const input =
    "w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-[#526d84]";

  const value = (name: keyof ProductFormValues) =>
    state.values ? (state.values[name] ?? "") : String(initial[name] ?? "");
  const err = (name: ProductField) => state.fieldErrors[name];
  const box = (name: ProductField) =>
    `${input} ${err(name) ? "border-rose-400" : "border-[#dfe6ec]"}`;


  const bind = (name: ProductField) => ({
    id: `f-${name}`,
    name,
    "aria-invalid": err(name) ? true : undefined,
    "aria-describedby": err(name) ? `f-${name}-error` : undefined,
    className: box(name),
  });

  return (
    <form
      key={state.values ? JSON.stringify(state.values) : "initial"} // remount so selects pick up the echoed values
      action={action}
      noValidate
      className="space-y-5"
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      {state.message && (
        <p role="alert" className="rounded-md bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          {t(state.message)}
        </p>
      )}

      <section className="grid gap-4 rounded-xl border border-[#e3e9ee] bg-white p-5 sm:grid-cols-2">
        <FieldBox t={t} error={err("name")} name="name" label="aFieldName">
          <input {...bind("name")} defaultValue={value("name")} maxLength={150} />
        </FieldBox>
        <FieldBox t={t} error={err("nameBn")} name="nameBn" label="aFieldNameBn">
          <input {...bind("nameBn")} defaultValue={value("nameBn")} maxLength={150} lang="bn" />
        </FieldBox>
        <FieldBox t={t} error={err("slug")} name="slug" label="aFieldSlug" hint="aSlugHint">
          <input {...bind("slug")} defaultValue={value("slug")} maxLength={100} />
        </FieldBox>
        <FieldBox t={t} error={err("sku")} name="sku" label="aFieldSku">
          <input {...bind("sku")} defaultValue={value("sku")} maxLength={50} />
        </FieldBox>
        <div className="sm:col-span-2">
          <FieldBox t={t} error={err("description")} name="description" label="aFieldDescription">
            <textarea {...bind("description")} defaultValue={value("description")} rows={3} maxLength={2000} />
          </FieldBox>
        </div>
        <div className="sm:col-span-2">
          <FieldBox t={t} error={err("descriptionBn")} name="descriptionBn" label="aFieldDescriptionBn">
            <textarea {...bind("descriptionBn")} defaultValue={value("descriptionBn")} rows={3} maxLength={2000} lang="bn" />
          </FieldBox>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-[#e3e9ee] bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
        <FieldBox t={t} error={err("category")} name="category" label="aCategory">
          <select {...bind("category")} defaultValue={value("category")}>
            <option value="">{t("aChoose")}</option>
            <option value="ring">{t("navRings")}</option>
            <option value="necklace">{t("navNecklaces")}</option>
            <option value="bracelet">{t("navBracelets")}</option>
          </select>
        </FieldBox>
        <FieldBox t={t} error={err("gender")} name="gender" label="aCollection">
          <select {...bind("gender")} defaultValue={value("gender")}>
            <option value="">{t("aChoose")}</option>
            <option value="men">{t("navMen")}</option>
            <option value="women">{t("navWomen")}</option>
          </select>
        </FieldBox>
        <FieldBox t={t} error={err("stock")} name="stock" label="aStock">
          <input {...bind("stock")} defaultValue={value("stock")} inputMode="numeric" />
        </FieldBox>
        <FieldBox t={t} error={err("price")} name="price" label="aFieldPrice">
          <input {...bind("price")} defaultValue={value("price")} inputMode="decimal" />
        </FieldBox>
        <FieldBox t={t} error={err("oldPrice")} name="oldPrice" label="aFieldSalePrice" hint="aSaleHint">
          <input {...bind("oldPrice")} defaultValue={value("oldPrice")} inputMode="decimal" />
        </FieldBox>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={state.values ? state.values.isActive === "on" : initial.isActive}
            className="h-5 w-5 accent-[#526d84]"
          />
          {t("aActive")}
        </label>
        <FieldBox t={t} error={err("sizes")} name="sizes" label="aFieldSizes" hint="aListHint">
          <input {...bind("sizes")} defaultValue={value("sizes")} />
        </FieldBox>
        <FieldBox t={t} error={err("colors")} name="colors" label="aFieldColors" hint="aListHint">
          <input {...bind("colors")} defaultValue={value("colors")} />
        </FieldBox>
      </section>

      <section className="rounded-xl border border-[#e3e9ee] bg-white p-5">
        <FieldBox t={t} error={err("images")} name="images" label="aFieldImages" hint="aImagesHint">
          <textarea {...bind("images")} defaultValue={value("images")} rows={4} placeholder="https://" />
        </FieldBox>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-md bg-[#526d84] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#40576b] disabled:opacity-60"
        >
          {pending ? t("aSaving") : t("aSave")}
        </button>
        <Link
          href="/admin/products"
          className="flex min-h-11 items-center rounded-md border border-[#d5dee6] px-6 py-2.5 text-sm hover:bg-[#f0f4f7]"
        >
          {t("aCancel")}
        </Link>
      </div>
    </form>
  );
}
