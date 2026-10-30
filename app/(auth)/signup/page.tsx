import { Suspense } from "react";
import { safeReturnTo } from "@/lib/safe-redirect";
import AuthForm from "../auth-form";

export default function Page(props: PageProps<"/signup">) {
  return (
    <Suspense fallback={null}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ searchParams }: PageProps<"/signup">) {
  const { next, returnTo } = await searchParams;
  const safe = safeReturnTo(next ?? returnTo);
  return <AuthForm mode="signup" next={safe} />;
}
