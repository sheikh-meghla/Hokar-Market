import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ALL_STATUSES, isOrderStatus } from "@/lib/admin-orders";
import { Prisma } from "../../../generated/prisma/client";
import FilterBar from "../../_components/filter-bar";
import { DateText, Money, Num, StatusBadge, T } from "../../_components/i18n";
import Pagination, { PAGE_SIZE, pageParam } from "../../_components/pagination";

const sorts = ["newest", "oldest", "total-desc", "total-asc"] as const;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  // Layouts and pages render in parallel: never rely on the layout alone.
  await requireAdmin();
  const raw = await searchParams;
  const q = one(raw.q).trim().slice(0, 100);
  const statusRaw = one(raw.status);
  const status = isOrderStatus(statusRaw) ? statusRaw : "";
  const sort = sorts.find((s) => s === one(raw.sort)) ?? "newest";
  const page = pageParam(raw.page);

  const where: Prisma.OrderWhereInput = {
    ...(q && {
      OR: [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { shippingName: { contains: q, mode: "insensitive" } },
        { shippingPhone: { contains: q } },
      ],
    }),
    ...(status && { status }),
  };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy:
        sort === "oldest" ? { createdAt: "asc" }
        : sort === "total-desc" ? { totalAmount: "desc" }
        : sort === "total-asc" ? { totalAmount: "asc" }
        : { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { items: { select: { quantity: true } } },
    }),
  ]);

  const values = { q, status, sort: sort === "newest" ? "" : sort };

  return (
    <div>
      <h1 className="mb-5 font-serif text-2xl"><T k="aNavOrders" /></h1>

      <FilterBar
        resetHref="/admin/orders"
        values={values}
        fields={[
          { kind: "search", name: "q", placeholder: "aSearchOrders" },
          {
            kind: "select", name: "status", label: "aStatus",
            options: ALL_STATUSES.map((s) => ({ value: s, label: `status${s}` as const })),
          },
          {
            kind: "select", name: "sort", label: "sortLabel",
            options: [
              { value: "oldest", label: "aSortOldest" },
              { value: "total-desc", label: "aSortTotalDesc" },
              { value: "total-asc", label: "aSortTotalAsc" },
            ],
          },
        ]}
      />

      {orders.length === 0 ? (
        <p className="rounded-xl border border-[#e3e9ee] bg-white p-10 text-center text-sm text-[#7e92a6]">
          <T k="aNoOrders" />
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e3e9ee] bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-[#edf0f2] text-left text-xs text-[#7e92a6]">
              <tr>
                <th className="px-4 py-3 font-normal"><T k="aOrder" /></th>
                <th className="px-4 py-3 font-normal"><T k="aCustomer" /></th>
                <th className="px-4 py-3 font-normal"><T k="ocDate" /></th>
                <th className="px-4 py-3 text-right font-normal"><T k="aItems" /></th>
                <th className="px-4 py-3 text-right font-normal"><T k="cartTotal" /></th>
                <th className="px-4 py-3 font-normal"><T k="coPaymentMethod" /></th>
                <th className="px-4 py-3 font-normal"><T k="aStatus" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f2]">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-[#526d84] hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {order.shippingName}
                    <div className="text-[11px] text-[#7e92a6]">{order.shippingPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-[#7e92a6]"><DateText iso={order.createdAt.toISOString()} withTime /></td>
                  <td className="px-4 py-3 text-right"><Num value={order.items.reduce((s, i) => s + i.quantity, 0)} /></td>
                  <td className="px-4 py-3 text-right"><Money value={Number(order.totalAmount)} /></td>
                  <td className="px-4 py-3"><T k="coCod" /></td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        basePath="/admin/orders"
        params={Object.fromEntries(Object.entries(values).filter(([, v]) => v)) as Record<string, string>}
        page={page}
        total={total}
      />
    </div>
  );
}
