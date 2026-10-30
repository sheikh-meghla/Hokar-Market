import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { INACTIVE_STATUSES } from "@/lib/admin-orders";
import { Prisma } from "../../../generated/prisma/client";
import FilterBar from "../../_components/filter-bar";
import { DateText, Money, Num, T } from "../../_components/i18n";
import Pagination, { PAGE_SIZE, pageParam } from "../../_components/pagination";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  // Layouts and pages render in parallel: never rely on the layout alone.
  await requireAdmin();
  const raw = await searchParams;
  const q = one(raw.q).trim().slice(0, 100);
  const page = pageParam(raw.page);

  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    }),
  };

  const [total, customers] = await Promise.all([
    prisma.user.count({ where }),
    // Only safe columns are selected: never the password hash.
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, name: true, email: true, phone: true, createdAt: true,
        orders: { select: { totalAmount: true, status: true } },
      },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-5 font-serif text-2xl"><T k="aNavCustomers" /></h1>

      <FilterBar
        resetHref="/admin/customers"
        values={{ q }}
        fields={[{ kind: "search", name: "q", placeholder: "aSearchCustomers" }]}
      />

      {customers.length === 0 ? (
        <p className="rounded-xl border border-[#e3e9ee] bg-white p-10 text-center text-sm text-[#7e92a6]">
          <T k="aNoCustomers" />
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e3e9ee] bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-[#edf0f2] text-left text-xs text-[#7e92a6]">
              <tr>
                <th className="px-4 py-3 font-normal"><T k="aName" /></th>
                <th className="px-4 py-3 font-normal"><T k="aEmail" /></th>
                <th className="px-4 py-3 font-normal"><T k="coPhone" /></th>
                <th className="px-4 py-3 font-normal"><T k="aRegistered" /></th>
                <th className="px-4 py-3 text-right font-normal"><T k="aNavOrders" /></th>
                <th className="px-4 py-3 text-right font-normal"><T k="aSpent" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f2]">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${customer.id}`} className="font-medium text-[#526d84] hover:underline">
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{customer.email}</td>
                  <td className="px-4 py-3 text-[#7e92a6]">{customer.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-[#7e92a6]"><DateText iso={customer.createdAt.toISOString()} /></td>
                  <td className="px-4 py-3 text-right"><Num value={customer.orders.length} /></td>
                  <td className="px-4 py-3 text-right">
                    <Money
                      value={customer.orders
                        .filter((o) => !INACTIVE_STATUSES.includes(o.status))
                        .reduce((sum, o) => sum + Number(o.totalAmount), 0)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-[11px] text-[#7e92a6]"><T k="aGuestNote" /></p>
      <Pagination basePath="/admin/customers" params={q ? { q } : {}} page={page} total={total} />
    </div>
  );
}
