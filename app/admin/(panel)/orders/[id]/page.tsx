import { requireAdmin } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { allowedTransitions } from "@/lib/admin-orders";
import ConfirmForm from "../../../_components/confirm-form";
import { DateText, Money, Notice, Num, StatusBadge, T } from "../../../_components/i18n";
import { updateOrderStatus } from "../../../actions";
import type { TranslationKey } from "@/lib/translations";

const actionLabel: Record<string, TranslationKey> = {
  PROCESSING: "aMarkProcessing",
  SHIPPED: "aMarkShipped",
  DELIVERED: "aMarkDelivered",
  CANCELLED: "aCancelOrder",
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: PageProps<"/admin/orders/[id]">) {
  // Layouts and pages render in parallel: never rely on the layout alone.
  await requireAdmin();
  const { id } = await params;
  const { notice } = await searchParams;

  const [order, history] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { images: true, slug: true } } } },
      },
    }),
    prisma.auditLog.findMany({
      where: { entity: "Order", entityId: id },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (!order) notFound();

  const next = allowedTransitions[order.status];
  const card = "rounded-xl border border-[#e3e9ee] bg-white";

  return (
    <div className="max-w-5xl">
      <Link href="/admin/orders" className="text-xs text-[#526d84] hover:underline">
        ← <T k="aNavOrders" />
      </Link>
      <div className="mb-5 mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl">{order.orderNumber}</h1>
          <p className="mt-1 text-xs text-[#7e92a6]"><DateText iso={order.createdAt.toISOString()} withTime /></p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <Notice code={typeof notice === "string" ? notice : undefined} />

      <div className="grid gap-5 lg:grid-cols-3">
        <section className={`${card} lg:col-span-2`}>
          <h2 className="border-b border-[#edf0f2] px-4 py-3 text-sm font-medium"><T k="aOrderedItems" /></h2>
          <ul className="divide-y divide-[#edf0f2]">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-3 px-4 py-3 text-sm">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[#f2f3f4]">
                  {item.product.images[0] && (
                    <Image src={item.product.images[0]} alt={item.productName} fill unoptimized sizes="56px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${item.productId}`} className="font-medium hover:underline">
                    {item.productName}
                  </Link>
                  <p className="mt-0.5 text-xs text-[#7e92a6]">
                    {[item.color, item.size && `${item.size}`].filter(Boolean).join(" · ")}
                    {(item.color || item.size) && " · "}
                    <Num value={item.quantity} /> × <Money value={Number(item.price)} />
                  </p>
                </div>
                <span className="shrink-0 font-medium"><Money value={Number(item.price) * item.quantity} /></span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-[#edf0f2] px-4 py-3 text-sm">
            <div className="flex justify-between"><dt className="text-[#7e92a6]"><T k="cartSubtotal" /></dt><dd><Money value={Number(order.subtotalAmount)} /></dd></div>
            <div className="flex justify-between"><dt className="text-[#7e92a6]"><T k="cartDelivery" /></dt><dd><Money value={Number(order.shippingFee)} /></dd></div>
            <div className="flex justify-between border-t border-[#edf0f2] pt-2 font-semibold"><dt><T k="cartTotal" /></dt><dd><Money value={Number(order.totalAmount)} /></dd></div>
          </dl>
        </section>

        <div className="space-y-5">
          <section className={`${card} p-4 text-sm`}>
            <h2 className="mb-2 text-xs font-medium text-[#7e92a6]"><T k="aCustomer" /></h2>
            <p className="font-medium">{order.shippingName}</p>
            <p>{order.shippingPhone}</p>
            <p className="mt-2 text-[#526d84]">
              {order.shippingLine1}, {order.shippingCity} {order.shippingPostalCode}, {order.shippingCountry}
            </p>
            {order.deliveryNote && <p className="mt-2 text-xs text-[#7e92a6]">{order.deliveryNote}</p>}
            <p className="mt-3 text-xs text-[#7e92a6]">
              {order.user ? (
                <Link href={`/admin/customers/${order.user.id}`} className="underline">{order.user.email}</Link>
              ) : (
                <T k="aGuestOrder" />
              )}
            </p>
          </section>

          <section className={`${card} p-4 text-sm`}>
            <h2 className="mb-2 text-xs font-medium text-[#7e92a6]"><T k="coPaymentMethod" /></h2>
            <p className="font-medium"><T k="coCod" /></p>
            <p className="mt-1 text-xs text-[#7e92a6]"><T k="aNoPaymentRecord" /></p>
          </section>

          <section className={`${card} p-4`}>
            <h2 className="mb-3 text-xs font-medium text-[#7e92a6]"><T k="aUpdateStatus" /></h2>
            {next.length === 0 ? (
              <p className="text-sm text-[#7e92a6]"><T k="aFinalStatus" /></p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {next.map((status) => (
                  <ConfirmForm
                    key={status}
                    action={updateOrderStatus}
                    fields={{ id: order.id, status }}
                    label={actionLabel[status] ?? "aStatus"}
                    title="aConfirmStatusTitle"
                    message={status === "CANCELLED" ? "aConfirmCancelText" : "aConfirmStatusText"}
                    danger={status === "CANCELLED"}
                  />
                ))}
              </div>
            )}
          </section>

          <section className={`${card} p-4 text-sm`}>
            <h2 className="mb-3 text-xs font-medium text-[#7e92a6]"><T k="aHistory" /></h2>
            <ol className="space-y-2">
              <li className="flex items-center justify-between gap-2">
                <span><T k="aOrderPlaced" /></span>
                <span className="text-xs text-[#7e92a6]"><DateText iso={order.createdAt.toISOString()} withTime /></span>
              </li>
              {history.map((entry) => {
                const details = entry.details as { from?: string; to?: string } | null;
                return (
                  <li key={entry.id} className="flex items-center justify-between gap-2">
                    <span>{details?.to ? <StatusBadge status={details.to} /> : entry.action}</span>
                    <span className="text-xs text-[#7e92a6]"><DateText iso={entry.createdAt.toISOString()} withTime /></span>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
