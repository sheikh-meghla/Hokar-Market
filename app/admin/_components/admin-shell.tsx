"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  PackagePlus,
  Package,
  Receipt,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import LanguageSwitcher from "../../components/language-switcher";
import { useLanguage } from "../../components/language-provider";
import type { TranslationKey } from "@/lib/translations";

type NavItem = {
  href: string;
  label: TranslationKey;
  Icon: LucideIcon;
  /** Highlight when the path starts with this instead of matching exactly. */
  prefix?: boolean;
};

// Only sections that really work are listed.
const nav: NavItem[] = [
  { href: "/admin", label: "aNavOverview", Icon: LayoutDashboard },
  { href: "/admin/products", label: "aNavProducts", Icon: Package, prefix: true },
  { href: "/admin/products/new", label: "aNavAddProduct", Icon: PackagePlus },
  { href: "/admin/categories", label: "aNavCategories", Icon: FolderTree },
  { href: "/admin/orders", label: "aNavOrders", Icon: Receipt, prefix: true },
  { href: "/admin/customers", label: "aNavCustomers", Icon: Users, prefix: true },
  { href: "/admin/inventory", label: "aNavInventory", Icon: Boxes },
  { href: "/admin/reports", label: "aNavReports", Icon: BarChart3 },
];

export default function AdminShell({
  admin,
  logout,
  children,
}: {
  admin: { name: string; email: string };
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // "/admin/products" must not stay highlighted on "/admin/products/new".
  const activeHref = nav
    .filter((item) =>
      item.prefix ? pathname.startsWith(item.href) : pathname === item.href,
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const sidebar = (
    <div className="flex h-full flex-col bg-[#263e55] text-white">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 font-serif">
            C
          </span>
          <span className="font-serif text-base">Hokar Market</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t("aClose")}
          className="rounded p-1 hover:bg-white/10 lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label={t("aNavLabel")}>
        {nav.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={activeHref === href ? "page" : undefined}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
              activeHref === href
                ? "bg-white/15 font-medium"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={17} strokeWidth={1.7} />
            {t(label)}
          </Link>
        ))}

        <p className="px-3 pb-1 pt-4 text-[10px] uppercase tracking-widest text-white/40">
          {t("aCollections")}
        </p>
        <Link
          href="/admin/products?gender=men"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-md py-2.5 pl-10 pr-3 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          {t("navMen")}
        </Link>
        <Link
          href="/admin/products?gender=women"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-md py-2.5 pl-10 pr-3 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          {t("navWomen")}
        </Link>
      </nav>

      <form action={logout} className="border-t border-white/10 p-3">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={17} strokeWidth={1.7} />
          {t("aLogout")}
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f8fa] text-[#263e55]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-[#e3e9ee] bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t("openMenu")}
            className="rounded p-2 hover:bg-[#f1f4f7] lg:hidden"
          >
            <Menu size={20} />
          </button>
          <span className="hidden text-sm font-medium lg:block">
            {t("aAdminPanel")}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher />
            <div className="hidden text-right text-xs leading-4 sm:block">
              <p className="font-medium">{admin.name}</p>
              <p className="text-[#7e92a6]">{admin.email}</p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
