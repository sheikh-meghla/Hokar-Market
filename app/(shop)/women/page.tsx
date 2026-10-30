import CatalogPage from "../../components/catalog-page";

export default function Page({ searchParams }: PageProps<"/women">) {
  return <CatalogPage scope={{ gender: "women" }} searchParams={searchParams} />;
}
