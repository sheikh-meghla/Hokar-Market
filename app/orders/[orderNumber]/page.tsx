import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getOrderForConfirmation } from "@/lib/order-server";
import OrderConfirmation, { type OrderView } from "./order-confirmation";

export default function OrderPage(props: PageProps<"/orders/[orderNumber]">) {
  return (
    <Suspense fallback={null}>
      <OrderContent {...props} />
    </Suspense>
  );
}

async function OrderContent({
  params,
  searchParams,
}: PageProps<"/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  const { token } = await searchParams;

  // The link carries a secret token, so only the person who placed the order
  // (or someone they shared the link with) can read it.
  const order =
    typeof token === "string"
      ? await getOrderForConfirmation(orderNumber, token)
      : null;
  if (!order) notFound();

  const view: OrderView = {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    subtotal: Number(order.subtotalAmount),
    shippingFee: Number(order.shippingFee),
    total: Number(order.totalAmount),
    deliveryNote: order.deliveryNote,
    customer: {
      name: order.shippingName,
      phone: order.shippingPhone,
      address: order.shippingLine1,
      city: order.shippingCity,
      postalCode: order.shippingPostalCode,
      country: order.shippingCountry,
    },
    items: order.items.map((item) => ({
      id: item.id,
      slug: item.product.slug,
      name: {
        en: item.productName,
        bn: item.product.nameBn ?? item.productName,
      },
      image: item.product.images[0] ?? null,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: Number(item.price),
    })),
  };

  return <OrderConfirmation order={view} />;
}
