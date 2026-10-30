import { requireAdmin } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { categoryOptions, genderOptions } from "@/lib/admin-product";
import { Prisma } from "../../../generated/prisma/client";
import FilterBar from "../../_components/filter-bar";
import { DateText, Money, Notice, Num, T } from "../../_components/i18n";
import Pagination, { PAGE_SIZE, pageParam } from "../../_components/pagination";
import ConfirmForm from "../../_components/confirm-form";
import { deleteProduct } from "../../actions";
import type { TranslationKey } from "@/lib/translations";

const categorySlug = { ring: "rings", necklace: "necklaces", bracelet: "bracelets" } as const;
const sorts = ["newest", "price-asc", "price-desc", "stock-asc"] as const;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const pick = <T extends string>(v: string, allowed: readonly T[]) =>
  allowed.find((a) => a === v) ?? "";

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  // Layouts and pages render in parallel: never rely on the layout alone.
  await requireAdmin();
  const raw = await searchParams;
  const q = one(raw.q).trim().slice(0, 100);
  const category = pick(one(raw.category), categoryOptions);
  const gender = pick(one(raw.gender), genderOptions);
  const status = pick(one(raw.status), ["active", "inactive"] as const);
  const sort = pick(one(raw.sort), sorts) || "newest";
  const page = pageParam(raw.page);

  const where: Prisma.ProductWhereInput = {
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { nameBn: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(category && { category: { slug: categorySlug[category] } }),
    ...(gender && { gender: gender === "men" ? "MALE" : "FEMALE" }),
    ...(status && { isActive: status === "active" }),
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: { select: { slug: true } } },
      orderBy:
        sort === "price-asc" ? { price: "asc" }
        : sort === "price-desc" ? { price: "desc" }
        : sort === "stock-asc" ? { stock: "asc" }
        : { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const categoryLabel: Record<string, TranslationKey> = {
    rings: "navRings",
    necklaces: "navNecklaces",
    bracelets: "navBracelets",
  };
  const values = { q, category, gender, status, sort: sort === "newest" ? "" : sort };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl"><T k="aNavProducts" /></h1>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-[#526d84] px-4 py-2 text-sm font-medium text-white hover:bg-[#40576b]"
        >
          + <T k="aNavAddProduct" />
        </Link>
      </div>

      <Notice code={one(raw.notice)} />

      <FilterBar
        resetHref="/admin/products"
        values={values}
        fields={[
          { kind: "search", name: "q", placeholder: "aSearchProducts" },
          {
            kind: "select", name: "category", label: "aCategory",
            options: [
              { value: "ring", label: "navRings" },
              { value: "necklace", label: "navNecklaces" },
              { value: "bracelet", label: "navBracelets" },
            ],
          },
          {
            kind: "select", name: "gender", label: "aCollection",
            options: [
              { value: "men", label: "navMen" },
              { value: "women", label: "navWomen" },
            ],
          },
          {
            kind: "select", name: "status", label: "aStatus",
            options: [
              { value: "active", label: "aActive" },
              { value: "inactive", label: "aInactive" },
            ],
          },
          {
            kind: "select", name: "sort", label: "sortLabel",
            options: [
              { value: "price-asc", label: "sortPriceAsc" },
              { value: "price-desc", label: "sortPriceDesc" },
              { value: "stock-asc", label: "aSortStock" },
            ],
          },
        ]}
      />

      {products.length === 0 ? (
        <p className="rounded-xl border border-[#e3e9ee] bg-white p-10 text-center text-sm text-[#7e92a6]">
          <T k="aNoProducts" />
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e3e9ee] bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-[#edf0f2] text-left text-xs text-[#7e92a6]">
              <tr>
                <th className="px-4 py-3 font-normal"><T k="aProduct" /></th>
                <th className="px-4 py-3 font-normal">SKU</th>
                <th className="px-4 py-3 font-normal"><T k="aCategory" /></th>
                <th className="px-4 py-3 font-normal"><T k="aCollection" /></th>
                <th className="px-4 py-3 text-right font-normal"><T k="aPrice" /></th>
                <th className="px-4 py-3 text-right font-normal"><T k="aStock" /></th>
                <th className="px-4 py-3 font-normal"><T k="aStatus" /></th>
                <th className="px-4 py-3 font-normal"><T k="aCreated" /></th>
                <th className="px-4 py-3 font-normal"><span className="sr-only"><T k="aActions" /></span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f2]">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-[#f2f3f4]">
                        {product.images[0] && (
                          <Image src={product.images[0]} alt={product.name} fill unoptimized sizes="44px" className="object-cover" />
                        )}
                      </div>
                      <span className="min-w-0 font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#7e92a6]">{product.sku ?? "—"}</td>
                  <td className="px-4 py-3"><T k={categoryLabel[product.category.slug] ?? "aCategory"} /></td>
                  <td className="px-4 py-3"><T k={product.gender === "MALE" ? "navMen" : "navWomen"} /></td>
                  <td className="px-4 py-3 text-right"><Money value={Number(product.price)} /></td>
                  <td className={`px-4 py-3 text-right ${product.stock === 0 ? "font-medium text-rose-600" : ""}`}>
                    <Num value={product.stock} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${product.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      <T k={product.isActive ? "aActive" : "aInactive"} />
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#7e92a6]"><DateText iso={product.createdAt.toISOString()} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link href={`/products/${product.slug}`} className="rounded-md border border-[#d5dee6] px-3 py-1.5 text-xs text-[#526d84] hover:bg-[#f0f4f7]">
                        <T k="aView" />
                      </Link>
                      <Link href={`/admin/products/${product.id}`} className="rounded-md border border-[#d5dee6] px-3 py-1.5 text-xs text-[#526d84] hover:bg-[#f0f4f7]">
                        <T k="aEdit" />
                      </Link>
                      <ConfirmForm
                        action={deleteProduct}
                        fields={{ id: product.id }}
                        label="aDelete"
                        title="aDeleteProductTitle"
                        message="aDeleteProductText"
                        danger
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        basePath="/admin/products"
        params={Object.fromEntries(Object.entries(values).filter(([, v]) => v)) as Record<string, string>}
        page={page}
        total={total}
      />
    </div>
  );
}
