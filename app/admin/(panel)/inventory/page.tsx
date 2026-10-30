import { requireAdmin } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../generated/prisma/client";
import FilterBar from "../../_components/filter-bar";
import { Num, T } from "../../_components/i18n";
import Pagination, { PAGE_SIZE, pageParam } from "../../_components/pagination";
import StockForm from "../../_components/stock-form";

const LOW_STOCK = 5;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  // Layouts and pages render in parallel: never rely on the layout alone.
  await requireAdmin();
  const raw = await searchParams;
  const q = one(raw.q).trim().slice(0, 100);
  const level = (["out", "low", "ok"] as const).find((l) => l === one(raw.level)) ?? "";
  const page = pageParam(raw.page);

  const where: Prisma.ProductWhereInput = {
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] }),
    ...(level === "out" && { stock: 0 }),
    ...(level === "low" && { stock: { gt: 0, lte: LOW_STOCK } }),
    ...(level === "ok" && { stock: { gt: LOW_STOCK } }),
  };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: [{ stock: "asc" }, { name: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const params = Object.fromEntries(Object.entries({ q, level }).filter(([, v]) => v)) as Record<string, string>;

  return (
    <div>
      <h1 className="mb-5 font-serif text-2xl"><T k="aNavInventory" /></h1>

      <FilterBar
        resetHref="/admin/inventory"
        values={{ q, level }}
        fields={[
          { kind: "search", name: "q", placeholder: "aSearchProducts" },
          {
            kind: "select", name: "level", label: "aStock",
            options: [
              { value: "out", label: "outOfStock" },
              { value: "low", label: "aLowStock" },
              { value: "ok", label: "aInStock" },
            ],
          },
        ]}
      />

      {products.length === 0 ? (
        <p className="rounded-xl border border-[#e3e9ee] bg-white p-10 text-center text-sm text-[#7e92a6]"><T k="aNoProducts" /></p>
      ) : (
        <ul className="divide-y divide-[#edf0f2] rounded-xl border border-[#e3e9ee] bg-white">
          {products.map((product) => (
            <li key={product.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[#f2f3f4]">
                {product.images[0] && (
                  <Image src={product.images[0]} alt={product.name} fill unoptimized sizes="48px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1 basis-40">
                <Link href={`/admin/products/${product.id}`} className="font-medium hover:underline">{product.name}</Link>
                <p className="mt-0.5 text-xs">
                  {product.stock === 0 ? (
                    <span className="font-medium text-rose-600"><T k="outOfStock" /></span>
                  ) : product.stock <= LOW_STOCK ? (
                    <span className="font-medium text-amber-700"><T k="aLowStock" /> · <Num value={product.stock} /></span>
                  ) : (
                    <span className="text-[#7e92a6]"><T k="aInStock" /> · <Num value={product.stock} /></span>
                  )}
                </p>
              </div>
              <StockForm id={product.id} />
            </li>
          ))}
        </ul>
      )}

      <Pagination basePath="/admin/inventory" params={params} page={page} total={total} />
    </div>
  );
}
