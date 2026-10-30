import CatalogPage from "../../components/catalog-page";

export default function Page({ searchParams }: PageProps<"/men">) {
  return <CatalogPage scope={{ gender: "men" }} searchParams={searchParams} />;
}
