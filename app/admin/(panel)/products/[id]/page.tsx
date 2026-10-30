import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ConfirmForm from "../../../_components/confirm-form";
import { Notice, T } from "../../../_components/i18n";
import ProductForm from "../../../_components/product-form";
import { deleteProduct, setProductActive } from "../../../actions";

const categoryKey: Record<string, string> = {
  rings: "ring",
  necklaces: "necklace",
  bracelets: "bracelet",
};

export default async function EditProductPage({
  params,
  searchParams,
}: PageProps<"/admin/products/[id]">) {
  // Layouts and pages render in parallel: never rely on the layout alone.
  await requireAdmin();
  const { id } = await params;
  const { notice } = await searchParams;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: { select: { slug: true } }, _count: { select: { orderItems: true } } },
  });
  if (!product) notFound();

  return (
    <div className="max-w-4xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl">{product.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/products/${product.slug}`}
            className="rounded-md border border-[#d5dee6] px-3 py-1.5 text-xs text-[#526d84] hover:bg-[#f0f4f7]"
          >
            <T k="aView" />
          </Link>
          <ConfirmForm
            action={setProductActive}
            fields={{ id: product.id, active: String(!product.isActive) }}
            label={product.isActive ? "aDeactivate" : "aActivate"}
            title={product.isActive ? "aDeactivateTitle" : "aActivateTitle"}
            message={product.isActive ? "aDeactivateText" : "aActivateText"}
          />
          <ConfirmForm
            action={deleteProduct}
            fields={{ id: product.id }}
            label="aDelete"
            title="aDeleteProductTitle"
            message={product._count.orderItems > 0 ? "aDeleteHasOrdersText" : "aDeleteProductText"}
            danger
          />
        </div>
      </div>

      <Notice code={typeof notice === "string" ? notice : undefined} />

      <ProductForm
        initial={{
          id: product.id,
          name: product.name,
          nameBn: product.nameBn ?? "",
          slug: product.slug,
          sku: product.sku ?? "",
          description: product.description ?? "",
          descriptionBn: product.descriptionBn ?? "",
          category: categoryKey[product.category.slug] ?? "",
          gender: product.gender === "MALE" ? "men" : "women",
          price: String(Number(product.price)),
          oldPrice: product.oldPrice ? String(Number(product.oldPrice)) : "",
          stock: String(product.stock),
          sizes: product.sizes.join(", "),
          colors: product.colors.join(", "),
          images: product.images.join("\n"),
          isActive: product.isActive,
        }}
      />
    </div>
  );
}
