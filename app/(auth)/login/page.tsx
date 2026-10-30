import { Suspense } from "react";
import { safeReturnTo } from "@/lib/safe-redirect";
import AuthForm from "../auth-form";

export default function Page(props: PageProps<"/login">) {
  return (
    <Suspense fallback={null}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ searchParams }: PageProps<"/login">) {
  const { next, returnTo, error } = await searchParams;
  const safe = safeReturnTo(next ?? returnTo);
  return <AuthForm mode="signin" next={safe} googleFailed={error === "google"} />;
}
