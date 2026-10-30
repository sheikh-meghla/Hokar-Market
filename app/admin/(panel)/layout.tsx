import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { logoutAdmin } from "../actions";
import AdminShell from "../_components/admin-shell";

export const metadata = { title: "Hokar Market Admin", robots: { index: false } };

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f6f8fa]" aria-busy="true" />}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}

// Every admin page renders inside this check: no session or a non-admin role
// is redirected before any dashboard data is queried.
async function Guard({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <AdminShell admin={{ name: admin.name, email: admin.email }} logout={logoutAdmin}>
      {children}
    </AdminShell>
  );
}
