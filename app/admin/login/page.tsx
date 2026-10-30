import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./login-form";

export default function AdminLoginPage(props: PageProps<"/admin/login">) {
  return (
    <Suspense fallback={null}>
      <LoginContent {...props} />
    </Suspense>
  );
}

async function LoginContent({ searchParams }: PageProps<"/admin/login">) {
  const { denied } = await searchParams;
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect("/admin");
  return <LoginForm denied={denied === "1"} />;
}
