import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { INACTIVE_STATUSES } from "@/lib/admin-orders";
import { DateText, Money, Num, StatusBadge, T } from "../../../_components/i18n";

export default async function CustomerDetailPage({ params }: PageProps<"/admin/customers/[id]">) {
  // Layouts and pages render in parallel: never rely on the layout alone.
  await requireAdmin();
  const { id } = await params;

  // No passwordHash / session data is ever selected.
  const customer = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true, name: true, email: true, phone: true, createdAt: true,
      orders: {
        orderBy: { createdAt: "desc" },
        select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
      },
    },
  });
  if (!customer) notFound();

  const spent = customer.orders
    .filter((o) => !INACTIVE_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <div className="max-w-4xl">
      <Link href="/admin/customers" className="text-xs text-[#526d84] hover:underline">
        ← <T k="aNavCustomers" />
      </Link>
      <h1 className="mb-5 mt-2 font-serif text-2xl">{customer.name}</h1>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e3e9ee] bg-white p-4 text-sm">
          <p className="text-xs text-[#7e92a6]"><T k="aEmail" /></p>
          <p className="mt-1 break-all">{customer.email}</p>
          <p className="mt-3 text-xs text-[#7e92a6]"><T k="coPhone" /></p>
          <p className="mt-1">{customer.phone ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-[#e3e9ee] bg-white p-4 text-sm">
          <p className="text-xs text-[#7e92a6]"><T k="aRegistered" /></p>
          <p className="mt-1"><DateText iso={customer.createdAt.toISOString()} /></p>
          <p className="mt-3 text-xs text-[#7e92a6]"><T k="aNavOrders" /></p>
          <p className="mt-1"><Num value={customer.orders.length} /></p>
        </div>
        <div className="rounded-xl border border-[#e3e9ee] bg-white p-4 text-sm">
          <p className="text-xs text-[#7e92a6]"><T k="aSpent" /></p>
          <p className="mt-1 text-xl font-semibold"><Money value={spent} /></p>
        </div>
      </div>

      <section className="rounded-xl border border-[#e3e9ee] bg-white">
        <h2 className="border-b border-[#edf0f2] px-4 py-3 text-sm font-medium"><T k="aOrderHistory" /></h2>
        {customer.orders.length === 0 ? (
          <p className="p-6 text-center text-sm text-[#7e92a6]"><T k="aNoOrders" /></p>
        ) : (
          <ul className="divide-y divide-[#edf0f2] text-sm">
            {customer.orders.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <Link href={`/admin/orders/${order.id}`} className="font-medium text-[#526d84] hover:underline">
                  {order.orderNumber}
                </Link>
                <span className="text-xs text-[#7e92a6]"><DateText iso={order.createdAt.toISOString()} /></span>
                <StatusBadge status={order.status} />
                <Money value={Number(order.totalAmount)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
