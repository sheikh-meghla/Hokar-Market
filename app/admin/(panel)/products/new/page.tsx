import { requireAdmin } from "@/lib/auth";
import ProductForm, { emptyProduct } from "../../../_components/product-form";
import { T } from "../../../_components/i18n";

export default async function NewProductPage() {
  // Layouts and pages render in parallel: never rely on the layout alone.
  await requireAdmin();
  return (
    <div className="max-w-4xl">
      <h1 className="mb-5 font-serif text-2xl"><T k="aNavAddProduct" /></h1>
      <ProductForm initial={emptyProduct} />
    </div>
  );
}
