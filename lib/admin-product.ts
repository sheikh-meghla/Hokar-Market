import type { TranslationKey } from "./translations";

export type ProductField =
  | "name"
  | "nameBn"
  | "slug"
  | "sku"
  | "description"
  | "descriptionBn"
  | "category"
  | "gender"
  | "price"
  | "oldPrice"
  | "stock"
  | "sizes"
  | "colors"
  | "images";

export type ProductFormState = {
  ok: boolean;
  message?: TranslationKey;
  fieldErrors: Partial<Record<ProductField, TranslationKey>>;
  /** What was submitted, so a failed save does not wipe the form. */
  values?: Record<string, string>;
};

export type ParsedProduct = {
  name: string;
  nameBn: string | null;
  slug: string;
  sku: string | null;
  description: string | null;
  descriptionBn: string | null;
  category: "ring" | "necklace" | "bracelet";
  gender: "men" | "women";
  price: number;
  oldPrice: number | null;
  stock: number;
  sizes: string[];
  colors: string[];
  images: string[];
  isActive: boolean;
};

export const categoryOptions = ["ring", "necklace", "bracelet"] as const;
export const genderOptions = ["men", "women"] as const;

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function list(value: string, separator: RegExp) {
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);
}

function money(value: string): number | null {
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value)) return null;
  return Number(value);
}

/** Validates the admin product form. Runs on the server for every save. */
export function parseProductForm(
  formData: FormData,
): { data: ParsedProduct | null; fieldErrors: ProductFormState["fieldErrors"] } {
  const errors: ProductFormState["fieldErrors"] = {};

  const name = text(formData, "name");
  if (!name) errors.name = "aErrRequired";
  else if (name.length > 150) errors.name = "aErrTooLong";

  const nameBn = text(formData, "nameBn");
  if (nameBn.length > 150) errors.nameBn = "aErrTooLong";

  let slug = text(formData, "slug").toLowerCase();
  if (!slug) slug = slugify(name);
  if (!slug) errors.slug = "aErrRequired";
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) {
    errors.slug = "aErrSlug";
  }

  const sku = text(formData, "sku");
  if (sku && !/^[A-Za-z0-9._-]{1,50}$/.test(sku)) errors.sku = "aErrSku";

  const description = text(formData, "description");
  if (description.length > 2000) errors.description = "aErrTooLong";
  const descriptionBn = text(formData, "descriptionBn");
  if (descriptionBn.length > 2000) errors.descriptionBn = "aErrTooLong";

  const category = categoryOptions.find((c) => c === text(formData, "category"));
  if (!category) errors.category = "aErrRequired";
  const gender = genderOptions.find((g) => g === text(formData, "gender"));
  if (!gender) errors.gender = "aErrRequired";

  const price = money(text(formData, "price"));
  if (price === null || price <= 0) errors.price = "aErrPrice";

  const oldPriceText = text(formData, "oldPrice");
  let oldPrice: number | null = null;
  if (oldPriceText) {
    oldPrice = money(oldPriceText);
    if (oldPrice === null || (price !== null && oldPrice <= price)) {
      errors.oldPrice = "aErrOldPrice";
    }
  }

  const stockText = text(formData, "stock");
  const stock = /^\d{1,6}$/.test(stockText) ? Number(stockText) : null;
  if (stock === null) errors.stock = "aErrStock";

  const sizes = list(text(formData, "sizes"), /[,\n]/);
  if (sizes.length > 20 || sizes.some((s) => s.length > 10)) errors.sizes = "aErrOptions";
  const colors = list(text(formData, "colors"), /[,\n]/);
  if (colors.length > 20 || colors.some((c) => c.length > 30)) errors.colors = "aErrOptions";

  const images = list(text(formData, "images"), /\r?\n/);
  const validImage = (url: string) => {
    if (url.length > 600) return false;
    try {
      return new URL(url).protocol === "https:";
    } catch {
      return false;
    }
  };
  if (images.length === 0 || images.length > 8 || !images.every(validImage)) {
    errors.images = "aErrImages";
  }

  if (Object.keys(errors).length > 0 || !category || !gender || price === null || stock === null) {
    return { data: null, fieldErrors: errors };
  }

  return {
    fieldErrors: errors,
    data: {
      name,
      nameBn: nameBn || null,
      slug,
      sku: sku || null,
      description: description || null,
      descriptionBn: descriptionBn || null,
      category,
      gender,
      price,
      oldPrice,
      stock,
      sizes,
      colors,
      images,
      isActive: formData.get("isActive") === "on",
    },
  };
}
