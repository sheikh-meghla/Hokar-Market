import {
  categoryKeys,
  genderKeys,
  getCatalogProducts,
  pick,
  type CategoryKey,
  type GenderKey,
  type SortKey,
} from "@/lib/catalog";
import CatalogView from "./catalog-view";

const sortKeys: SortKey[] = ["newest", "price-asc", "price-desc"];

type Scope = { category: CategoryKey } | { gender: GenderKey };

/**
 * Server component shared by /ring, /necklace, /bracelet, /men and /women.
 * The page itself fixes one dimension (category or gender); the other one and
 * the sort order come from the query string.
 */
export default async function CatalogPage({
  scope,
  searchParams,
}: {
  scope: Scope;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sort = pick(params.sort, sortKeys) ?? "newest";

  const category =
    "category" in scope ? scope.category : pick(params.category, categoryKeys);
  const gender =
    "gender" in scope ? scope.gender : pick(params.gender, genderKeys);

  const products = await getCatalogProducts({ category, gender, sort });

  return (
    <CatalogView
      scope={scope}
      basePath={`/${"category" in scope ? scope.category : scope.gender}`}
      selected={{ category, gender }}
      sort={sort}
      products={products}
    />
  );
}
