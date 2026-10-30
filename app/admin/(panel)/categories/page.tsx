import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Num, T } from "../../_components/i18n";
import type { TranslationKey } from "@/lib/translations";

// The storefront has a fixed set of categories and collections, so this page
// reports on them rather than letting admins create more.
const categories: { slug: string; key: string; label: TranslationKey }[] = [
  { slug: "rings", key: "ring", label: "navRings" },
  { slug: "necklaces", key: "necklace", label: "navNecklaces" },
  { slug: "bracelets", key: "bracelet", label: "navBracelets" },
];
const collections: { gender: "MALE" | "FEMALE"; key: string; label: TranslationKey }[] = [
  { gender: "MALE", key: "men", label: "navMen" },
  { gender: "FEMALE", key: "women", label: "navWomen" },
];

export default async function CategoriesPage() {
  // Layouts and pages render in parallel: never rely on the layout alone.
  await requireAdmin();
  const [byCategory, byGender] = await Promise.all([
    Promise.all(
      categories.map(async (c) => ({
        ...c,
        total: await prisma.product.count({ where: { category: { slug: c.slug } } }),
        active: await prisma.product.count({ where: { category: { slug: c.slug }, isActive: true } }),
      })),
    ),
    Promise.all(
      collections.map(async (c) => ({
        ...c,
        total: await prisma.product.count({ where: { gender: c.gender } }),
        active: await prisma.product.count({ where: { gender: c.gender, isActive: true } }),
      })),
    ),
  ]);

  const block = (
    title: TranslationKey,
    rows: { key: string; label: TranslationKey; total: number; active: number }[],
    param: "category" | "gender",
  ) => (
    <section className="rounded-xl border border-[#e3e9ee] bg-white">
      <h2 className="border-b border-[#edf0f2] px-4 py-3 text-sm font-medium"><T k={title} /></h2>
      <ul className="divide-y divide-[#edf0f2]">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <Link href={`/admin/products?${param}=${row.key}`} className="font-medium text-[#526d84] hover:underline">
              <T k={row.label} />
            </Link>
            <span className="text-[#7e92a6]">
              <Num value={row.total} /> <T k="aNavProducts" /> · <Num value={row.active} /> <T k="aActive" />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="max-w-3xl">
      <h1 className="mb-5 font-serif text-2xl"><T k="aNavCategories" /></h1>
      <div className="space-y-5">
        {block("aCategory", byCategory, "category")}
        {block("aCollection", byGender, "gender")}
      </div>
      <p className="mt-3 text-[11px] text-[#7e92a6]"><T k="aFixedNote" /></p>
    </div>
  );
}
