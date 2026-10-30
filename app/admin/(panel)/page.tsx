import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { INACTIVE_STATUSES, REVENUE_STATUSES } from "@/lib/admin-orders";
import { DateText, Money, Num, StatusBadge, T } from "../_components/i18n";
import type { TranslationKey } from "@/lib/translations";

const LOW_STOCK = 5;

export default async function OverviewPage() {
  // Layouts and pages render in parallel: never rely on the layout alone.
  await requireAdmin();
  const [
    productCount,
    customerCount,
    byStatus,
    revenue,
    recentOrders,
    lowStock,
    soldItems,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.aggregate({
      where: { status: { in: REVENUE_STATUSES } },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { _count: { select: { items: true } } },
    }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: LOW_STOCK } },
      orderBy: { stock: "asc" },
      take: 8,
      select: { id: true, name: true, nameBn: true, stock: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { status: { notIn: INACTIVE_STATUSES } } },
      select: { productId: true, productName: true, quantity: true },
    }),
  ]);

  const count = (status: string) =>
    byStatus.find((row) => row.status === status)?._count._all ?? 0;
  const totalOrders = byStatus.reduce((sum, row) => sum + row._count._all, 0);

  // Best sellers = units sold in orders that were not cancelled or refunded.
  const sold = new Map<string, { name: string; quantity: number }>();
  for (const item of soldItems) {
    const row = sold.get(item.productId) ?? { name: item.productName, quantity: 0 };
    row.quantity += item.quantity;
    sold.set(item.productId, row);
  }
  const bestSellers = [...sold.entries()]
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 5);

  const cards: { label: TranslationKey; value: React.ReactNode; href?: string }[] = [
    { label: "aStatProducts", value: <Num value={productCount} />, href: "/admin/products" },
    { label: "aStatOrders", value: <Num value={totalOrders} />, href: "/admin/orders" },
    { label: "aStatPending", value: <Num value={count("PENDING")} />, href: "/admin/orders?status=PENDING" },
    { label: "aStatProcessing", value: <Num value={count("PROCESSING")} />, href: "/admin/orders?status=PROCESSING" },
    { label: "aStatShippedDelivered", value: <Num value={count("SHIPPED") + count("DELIVERED")} /> },
    { label: "aStatCancelled", value: <Num value={count("CANCELLED")} />, href: "/admin/orders?status=CANCELLED" },
    { label: "aStatCustomers", value: <Num value={customerCount} />, href: "/admin/customers" },
    { label: "aStatRevenue", value: <Money value={Number(revenue._sum.totalAmount ?? 0)} /> },
  ];

  return (
    <div>
      <h1 className="mb-5 font-serif text-2xl"><T k="aNavOverview" /></h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => {
          const body = (
            <>
              <p className="text-xs text-[#7e92a6]"><T k={card.label} /></p>
              <p className="mt-2 text-2xl font-semibold">{card.value}</p>
            </>
          );
          const cls = "rounded-xl border border-[#e3e9ee] bg-white p-4";
          return card.href ? (
            <Link key={card.label} href={card.href} className={`${cls} transition hover:border-[#526d84]`}>
              {body}
            </Link>
          ) : (
            <div key={card.label} className={cls}>{body}</div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-[#7e92a6]"><T k="aRevenueNote" /></p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-[#e3e9ee] bg-white lg:col-span-2">
          <h2 className="border-b border-[#edf0f2] px-4 py-3 text-sm font-medium"><T k="aRecentOrders" /></h2>
          {recentOrders.length === 0 ? (
            <p className="p-6 text-center text-sm text-[#7e92a6]"><T k="aNoOrders" /></p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-[#7e92a6]">
                  <tr>
                    <th className="px-4 py-2 font-normal"><T k="aOrder" /></th>
                    <th className="px-4 py-2 font-normal"><T k="aCustomer" /></th>
                    <th className="px-4 py-2 font-normal"><T k="aStatus" /></th>
                    <th className="px-4 py-2 text-right font-normal"><T k="cartTotal" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0f2]">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/orders/${order.id}`} className="font-medium text-[#526d84] hover:underline">
                          {order.orderNumber}
                        </Link>
                        <div className="text-[11px] text-[#7e92a6]"><DateText iso={order.createdAt.toISOString()} /></div>
                      </td>
                      <td className="px-4 py-2.5">{order.shippingName}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-2.5 text-right"><Money value={Number(order.totalAmount)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-[#e3e9ee] bg-white">
            <h2 className="border-b border-[#edf0f2] px-4 py-3 text-sm font-medium"><T k="aBestSellers" /></h2>
            {bestSellers.length === 0 ? (
              <p className="p-5 text-center text-sm text-[#7e92a6]"><T k="aNoSales" /></p>
            ) : (
              <ul className="divide-y divide-[#edf0f2] text-sm">
                {bestSellers.map(([id, row]) => (
                  <li key={id} className="flex justify-between gap-3 px-4 py-2.5">
                    <span className="min-w-0 truncate">{row.name}</span>
                    <span className="shrink-0 text-[#7e92a6]"><T k="aUnits" params={{ count: row.quantity }} /></span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-[#e3e9ee] bg-white">
            <h2 className="border-b border-[#edf0f2] px-4 py-3 text-sm font-medium"><T k="aLowStock" /></h2>
            {lowStock.length === 0 ? (
              <p className="p-5 text-center text-sm text-[#7e92a6]"><T k="aNoLowStock" /></p>
            ) : (
              <ul className="divide-y divide-[#edf0f2] text-sm">
                {lowStock.map((product) => (
                  <li key={product.id} className="flex justify-between gap-3 px-4 py-2.5">
                    <Link href={`/admin/products/${product.id}`} className="min-w-0 truncate hover:underline">
                      {product.name}
                    </Link>
                    <span className={`shrink-0 font-medium ${product.stock === 0 ? "text-rose-600" : "text-amber-700"}`}>
                      <Num value={product.stock} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
