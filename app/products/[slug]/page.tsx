import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProductView, getRelatedItems } from "@/lib/catalog";
import ProductDetails from "./product-details";

export default function ProductPage(props: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" aria-busy="true" />}>
      <ProductContent {...props} />
    </Suspense>
  );
}

async function ProductContent({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;

  // Products come from the database, so new products work without a redeploy.
  const product = await getProductView(slug);
  if (!product) notFound();

  const related = await getRelatedItems(product);
  return <ProductDetails product={product} related={related} />;
}
