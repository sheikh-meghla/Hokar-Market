import CatalogPage from "../../components/catalog-page";

export default function Page({ searchParams }: PageProps<"/necklace">) {
  return <CatalogPage scope={{ category: "necklace" }} searchParams={searchParams} />;
}
