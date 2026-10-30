"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type {
  CatalogItem,
  CategoryKey,
  GenderKey,
  SortKey,
} from "@/lib/catalog";
import type { TranslationKey } from "@/lib/translations";
import { useLanguage } from "./language-provider";
import SiteFooter from "./site-footer";
import SiteHeader from "./site-header";

const categoryLabels: Record<CategoryKey, TranslationKey> = {
  ring: "navRings",
  necklace: "navNecklaces",
  bracelet: "navBracelets",
};
const genderLabels: Record<GenderKey, TranslationKey> = {
  men: "navMen",
  women: "navWomen",
};
const sortLabels: Record<SortKey, TranslationKey> = {
  newest: "sortNewest",
  "price-asc": "sortPriceAsc",
  "price-desc": "sortPriceDesc",
};
const colorLabels: Record<string, TranslationKey> = {
  Gold: "colorGold",
  Silver: "colorSilver",
  "Rose Gold": "colorRoseGold",
};

type Props = {
  scope: { category: CategoryKey } | { gender: GenderKey };
  basePath: string;
  selected: { category?: CategoryKey; gender?: GenderKey };
  sort: SortKey;
  products: CatalogItem[];
};

function href(
  basePath: string,
  params: { category?: string; gender?: string; sort?: string },
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && value !== "newest") query.set(key, value);
  }
  const text = query.toString();
  return text ? `${basePath}?${text}` : basePath;
}

function Chip({
  active,
  href: to,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={to}
      aria-current={active ? "true" : undefined}
      scroll={false}
      className={`rounded-full border px-3.5 py-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526d84] focus-visible:ring-offset-1 ${
        active
          ? "border-[#526d84] bg-[#526d84] text-white"
          : "border-[#dfe6ec] bg-white text-[#526d84] hover:bg-[#edf0f3]"
      }`}
    >
      {children}
    </Link>
  );
}

export default function CatalogView({
  scope,
  basePath,
  selected,
  sort,
  products,
}: Props) {
  const { t, l, formatNumber } = useLanguage();

  const isCategoryPage = "category" in scope;
  const title = isCategoryPage
    ? t(categoryLabels[scope.category])
    : t(genderLabels[scope.gender]);

  // The dimension the page does not fix becomes the filter row.
  const filterOptions: { key: string; label: string; value?: string }[] =
    isCategoryPage
      ? [
          { key: "all", label: t("filterAll") },
          { key: "men", label: t("navMen"), value: "men" },
          { key: "women", label: t("navWomen"), value: "women" },
        ]
      : [
          { key: "all", label: t("filterAll") },
          { key: "ring", label: t("navRings"), value: "ring" },
          { key: "necklace", label: t("navNecklaces"), value: "necklace" },
          { key: "bracelet", label: t("navBracelets"), value: "bracelet" },
        ];
  const filterParam = isCategoryPage ? "gender" : "category";
  const filterValue = isCategoryPage ? selected.gender : selected.category;

  return (
    <main className="min-h-screen bg-white text-[#263e55]">
      <SiteHeader />

      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-[#e8edf1] pb-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl">{title}</h1>
            <p className="mt-1 text-xs text-[#7e92a6]">
              {t("catalogCount", { count: formatNumber(products.length) })}
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
          <nav
            aria-label={t(isCategoryPage ? "filterGender" : "filterCategory")}
            className="flex flex-wrap gap-2"
          >
            {filterOptions.map((option) => (
              <Chip
                key={option.key}
                active={(filterValue ?? undefined) === option.value}
                href={href(basePath, { [filterParam]: option.value, sort })}
              >
                {option.label}
              </Chip>
            ))}
          </nav>

          <nav aria-label={t("sortLabel")} className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#7e92a6]">{t("sortLabel")}:</span>
            {(Object.keys(sortLabels) as SortKey[]).map((key) => (
              <Chip
                key={key}
                active={sort === key}
                href={href(basePath, { [filterParam]: filterValue, sort: key })}
              >
                {t(sortLabels[key])}
              </Chip>
            ))}
          </nav>
        </div>

        {products.length === 0 ? (
          <section className="mx-auto max-w-lg rounded-xl border border-[#e5e8eb] bg-[#f8f9fa] px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#526d84]">
              <ShoppingBag size={24} strokeWidth={1.6} />
            </div>
            <h2 className="mt-5 font-serif text-xl">{t("catalogEmpty")}</h2>
            <p className="mt-2 text-sm text-[#7e92a6]">{t("catalogEmptyText")}</p>
            <Link
              href="/"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-[#526d84] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#40576b]"
            >
              {t("catalogBrowse")}
            </Link>
          </section>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const name = l(product.name);
              const options = [
                product.colors.length > 0 &&
                  `${t("color")}: ${product.colors
                    .map((c) => (colorLabels[c] ? t(colorLabels[c]) : c))
                    .join(", ")}`,
                product.sizes.length > 0 &&
                  `${t("size")}: ${product.sizes
                    .map((s) => formatNumber(Number(s)))
                    .join(", ")}`,
              ].filter(Boolean) as string[];

              return (
                <li key={product.id} className="min-w-0">
                  <Link
                    href={`/products/${product.slug}`}
                    className="group block h-full overflow-hidden rounded-lg border border-[#e7edf2] bg-white transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526d84]"
                  >
                    <div className="relative aspect-square overflow-hidden bg-[#f5f5f4]">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={name}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[#c6d5e4]">
                          <ShoppingBag size={32} strokeWidth={1.4} />
                        </div>
                      )}
                      {!product.inStock && (
                        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-medium text-[#a16c65] shadow-sm">
                          {t("outOfStock")}
                        </span>
                      )}
                    </div>

                    <div className="p-3">
                      <h2 className="line-clamp-2 min-h-10 text-sm font-medium leading-5">
                        {name}
                      </h2>
                      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-semibold">
                          ৳{formatNumber(product.price)}
                        </span>
                        {product.oldPrice && (
                          <span className="text-xs text-[#9ba7b2] line-through">
                            ৳{formatNumber(product.oldPrice)}
                          </span>
                        )}
                      </div>
                      {options.length > 0 && (
                        <p className="mt-1.5 text-[11px] leading-4 text-[#7e92a6]">
                          {options.join(" · ")}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <SiteFooter />
    </main>
  );
}
