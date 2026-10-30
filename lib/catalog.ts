import { prisma } from "./prisma";
import type { Localized } from "./translations";

export type CategoryKey = "ring" | "necklace" | "bracelet";
export type GenderKey = "men" | "women";
export type SortKey = "newest" | "price-asc" | "price-desc";

export const categoryKeys: CategoryKey[] = ["ring", "necklace", "bracelet"];
export const genderKeys: GenderKey[] = ["men", "women"];

// Category.slug values stored in the database for each public route.
export const categorySlug: Record<CategoryKey, string> = {
  ring: "rings",
  necklace: "necklaces",
  bracelet: "bracelets",
};

const genderValue = { men: "MALE", women: "FEMALE" } as const;

export type CatalogItem = {
  id: string;
  slug: string;
  name: Localized;
  price: number;
  oldPrice: number | null;
  image: string | null;
  inStock: boolean;
  sizes: string[];
  colors: string[];
  category: CategoryKey;
};

export type CatalogQuery = {
  category?: CategoryKey;
  gender?: GenderKey;
  sort: SortKey;
};

/** Reads a query-string value and keeps it only if it is one of `allowed`. */
export function pick<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
): T | undefined {
  const single = Array.isArray(value) ? value[0] : value;
  return allowed.find((item) => item === single);
}

export async function getCatalogProducts(
  query: CatalogQuery,
): Promise<CatalogItem[]> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(query.category && {
        category: { slug: categorySlug[query.category] },
      }),
      ...(query.gender && { gender: genderValue[query.gender] }),
    },
    include: { category: { select: { slug: true } } },
    orderBy:
      query.sort === "price-asc"
        ? { price: "asc" }
        : query.sort === "price-desc"
          ? { price: "desc" }
          : { createdAt: "desc" },
  });

  const keyBySlug = new Map(
    categoryKeys.map((key) => [categorySlug[key], key]),
  );

  return products.flatMap((product) => {
    const category = keyBySlug.get(product.category.slug);
    if (!category) return []; // not one of the three storefront categories
    const price = Number(product.price);
    const oldPrice = product.oldPrice ? Number(product.oldPrice) : null;
    return {
      id: product.id,
      slug: product.slug,
      name: { en: product.name, bn: product.nameBn ?? product.name },
      price,
      oldPrice: oldPrice !== null && oldPrice > price ? oldPrice : null,
      image: product.images[0] ?? null,
      inStock: product.stock > 0,
      sizes: product.sizes,
      colors: product.colors,
      category,
    };
  });
}

export type ProductView = {
  id: string;
  slug: string;
  name: Localized;
  description: Localized;
  category: CategoryKey;
  price: number;
  oldPrice: number | null;
  images: string[];
  colors: string[];
  sizes: string[];
  stock: number;
};

/** One active product for its detail page, or null when it does not exist. */
export async function getProductView(slug: string): Promise<ProductView | null> {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: { category: { select: { slug: true } } },
  });
  if (!product) return null;

  const category = categoryKeys.find((key) => categorySlug[key] === product.category.slug);
  if (!category) return null;

  const price = Number(product.price);
  const oldPrice = product.oldPrice ? Number(product.oldPrice) : null;
  return {
    id: product.id,
    slug: product.slug,
    name: { en: product.name, bn: product.nameBn ?? product.name },
    description: {
      en: product.description ?? "",
      bn: product.descriptionBn ?? product.description ?? "",
    },
    category,
    price,
    oldPrice: oldPrice !== null && oldPrice > price ? oldPrice : null,
    images: product.images,
    colors: product.colors,
    sizes: product.sizes,
    stock: product.stock,
  };
}

/** Other products, same category first. */
export async function getRelatedItems(product: ProductView, limit = 4) {
  const all = await getCatalogProducts({ sort: "newest" });
  const others = all.filter((item) => item.id !== product.id);
  return [
    ...others.filter((item) => item.category === product.category),
    ...others.filter((item) => item.category !== product.category),
  ].slice(0, limit);
}
