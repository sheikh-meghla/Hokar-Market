import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { INACTIVE_STATUSES, REVENUE_STATUSES } from "@/lib/admin-orders";
import FilterBar from "../../_components/filter-bar";
import { Money, Num, StatusBadge, T } from "../../_components/i18n";
import type { TranslationKey } from "@/lib/translations";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const DAY = 24 * 60 * 60 * 1000;

// Business days are Dhaka days (UTC+6, no daylight saving).
const dhakaDay = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(date);
const validDate = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : "");

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  // Layouts and pages render in parallel: never rely on the layout alone.
  await requireAdmin();
  const raw = await searchParams;
  const today = dhakaDay(new Date());
  const to = validDate(one(raw.to)) || today;
  const from = validDate(one(raw.from)) || dhakaDay(new Date(Date.parse(`${to}T00:00:00+06:00`) - 29 * DAY));

  // [from 00:00, to+1 00:00) in Dhaka time
  const start = new Date(`${from}T00:00:00+06:00`);
  const end = new Date(Date.parse(`${to}T00:00:00+06:00`) + DAY);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: {
      items: {
        include: { product: { select: { gender: true, category: { select: { slug: true } } } } },
      },
    },
  });

  const valid = orders.filter((o) => !INACTIVE_STATUSES.includes(o.status));
  const revenueOrders = orders.filter((o) => REVENUE_STATUSES.includes(o.status));
  const sum = (list: typeof orders) => list.reduce((s, o) => s + Number(o.totalAmount), 0);

  const byStatus = new Map<string, number>();
  for (const o of orders) byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);

  const byDay = new Map<string, { orders: number; value: number; revenue: number }>();
  for (const o of orders) {
    const day = dhakaDay(o.createdAt);
    const row = byDay.get(day) ?? { orders: 0, value: 0, revenue: 0 };
    row.orders += 1;
    if (!INACTIVE_STATUSES.includes(o.status)) row.value += Number(o.totalAmount);
    if (REVENUE_STATUSES.includes(o.status)) row.revenue += Number(o.totalAmount);
    byDay.set(day, row);
  }
  const days = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const maxValue = Math.max(1, ...days.map(([, r]) => r.value));

  const products = new Map<string, { name: string; quantity: number; amount: number }>();
  const categories = new Map<string, { quantity: number; amount: number }>();
  const genders = new Map<string, { quantity: number; amount: number }>();
  for (const o of valid) {
    for (const item of o.items) {
      const amount = Number(item.price) * item.quantity;
      const p = products.get(item.productId) ?? { name: item.productName, quantity: 0, amount: 0 };
      p.quantity += item.quantity; p.amount += amount; products.set(item.productId, p);
      const cat = item.product.category.slug;
      const c = categories.get(cat) ?? { quantity: 0, amount: 0 };
      c.quantity += item.quantity; c.amount += amount; categories.set(cat, c);
      const g = genders.get(item.product.gender) ?? { quantity: 0, amount: 0 };
      g.quantity += item.quantity; g.amount += amount; genders.set(item.product.gender, g);
    }
  }
  const topProducts = [...products.values()].sort((a, b) => b.amount - a.amount).slice(0, 10);

  const catLabel: Record<string, TranslationKey> = { rings: "navRings", necklaces: "navNecklaces", bracelets: "navBracelets" };
  const genderLabel: Record<string, TranslationKey> = { MALE: "navMen", FEMALE: "navWomen" };

  const card = "rounded-xl border border-[#e3e9ee] bg-white";
  const head = "border-b border-[#edf0f2] px-4 py-3 text-sm font-medium";

  const summary = (
    title: TranslationKey,
    rows: [TranslationKey, { quantity: number; amount: number }][],
  ) => (
    <section className={card}>
      <h2 className={head}><T k={title} /></h2>
      {rows.length === 0 ? (
        <p className="p-5 text-center text-sm text-[#7e92a6]"><T k="aNoSales" /></p>
      ) : (
        <ul className="divide-y divide-[#edf0f2] text-sm">
          {rows.map(([label, row]) => (
            <li key={label} className="flex justify-between gap-3 px-4 py-2.5">
              <span><T k={label} /></span>
              <span className="text-[#7e92a6]"><T k="aUnits" params={{ count: row.quantity }} /> · <Money value={row.amount} /></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div>
      <h1 className="mb-5 font-serif text-2xl"><T k="aNavReports" /></h1>

      <FilterBar
        resetHref="/admin/reports"
        values={{ from, to }}
        fields={[
          { kind: "date", name: "from", label: "aFrom" },
          { kind: "date", name: "to", label: "aTo" },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "aStatOrders" as const, value: <Num value={orders.length} /> },
          { label: "aOrderValue" as const, value: <Money value={sum(valid)} /> },
          { label: "aStatRevenue" as const, value: <Money value={sum(revenueOrders)} /> },
          { label: "aStatPending" as const, value: <Num value={byStatus.get("PENDING") ?? 0} /> },
        ].map((c) => (
          <div key={c.label} className={`${card} p-4`}>
            <p className="text-xs text-[#7e92a6]"><T k={c.label} /></p>
            <p className="mt-2 text-2xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-[#7e92a6]"><T k="aRevenueNote" /></p>

      <div className="mt-5 flex flex-wrap gap-2">
        {[...byStatus.entries()].map(([status, count]) => (
          <span key={status} className="flex items-center gap-2 rounded-full border border-[#e3e9ee] bg-white px-3 py-1 text-xs">
            <StatusBadge status={status} /> <Num value={count} />
          </span>
        ))}
      </div>

      <section className={`${card} mt-5`}>
        <h2 className={head}><T k="aOrdersByDate" /></h2>
        {days.length === 0 ? (
          <p className="p-6 text-center text-sm text-[#7e92a6]"><T k="aNoOrdersRange" /></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs text-[#7e92a6]">
                <tr>
                  <th className="px-4 py-2 font-normal"><T k="ocDate" /></th>
                  <th className="px-4 py-2 text-right font-normal"><T k="aStatOrders" /></th>
                  <th className="px-4 py-2 text-right font-normal"><T k="aOrderValue" /></th>
                  <th className="px-4 py-2 text-right font-normal"><T k="aStatRevenue" /></th>
                  <th className="w-1/4 px-4 py-2" aria-hidden="true" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0f2]">
                {days.map(([day, row]) => (
                  <tr key={day}>
                    <td className="px-4 py-2">{day}</td>
                    <td className="px-4 py-2 text-right"><Num value={row.orders} /></td>
                    <td className="px-4 py-2 text-right"><Money value={row.value} /></td>
                    <td className="px-4 py-2 text-right"><Money value={row.revenue} /></td>
                    <td className="px-4 py-2" aria-hidden="true">
                      <div className="h-2 rounded bg-[#526d84]" style={{ width: `${Math.round((row.value / maxValue) * 100)}%` }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className={card}>
          <h2 className={head}><T k="aBestSellers" /></h2>
          {topProducts.length === 0 ? (
            <p className="p-5 text-center text-sm text-[#7e92a6]"><T k="aNoSales" /></p>
          ) : (
            <ul className="divide-y divide-[#edf0f2] text-sm">
              {topProducts.map((p) => (
                <li key={p.name} className="flex justify-between gap-3 px-4 py-2.5">
                  <span className="min-w-0 truncate">{p.name}</span>
                  <span className="shrink-0 text-[#7e92a6]"><T k="aUnits" params={{ count: p.quantity }} /> · <Money value={p.amount} /></span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-5">
          {summary("aCategoryPerformance", [...categories.entries()].map(([slug, row]) => [catLabel[slug] ?? "aCategory", row]))}
          {summary("aCollectionPerformance", [...genders.entries()].map(([g, row]) => [genderLabel[g] ?? "aCollection", row]))}
        </div>
      </div>
    </div>
  );
}
