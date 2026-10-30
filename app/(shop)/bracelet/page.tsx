import CatalogPage from "../../components/catalog-page";

export default function Page({ searchParams }: PageProps<"/bracelet">) {
  return <CatalogPage scope={{ category: "bracelet" }} searchParams={searchParams} />;
}
