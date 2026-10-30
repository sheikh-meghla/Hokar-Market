import CatalogPage from "../../components/catalog-page";

export default function Page({ searchParams }: PageProps<"/ring">) {
  return <CatalogPage scope={{ category: "ring" }} searchParams={searchParams} />;
}
