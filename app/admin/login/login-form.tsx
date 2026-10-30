"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAdmin, type LoginState } from "../actions";
import { useLanguage } from "../../components/language-provider";
import LanguageSwitcher from "../../components/language-switcher";

export default function LoginForm({ denied }: { denied: boolean }) {
  const { t } = useLanguage();
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAdmin,
    {},
  );

  const field =
    "w-full rounded-md border border-[#dfe6ec] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#526d84]";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f6f8fa] px-4 py-10 text-[#263e55]">
      <div className="mb-4 self-end sm:absolute sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>

      <form
        action={action}
        className="w-full max-w-sm rounded-xl border border-[#e3e9ee] bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#526d84] font-serif text-xl">
            C
          </span>
          <h1 className="mt-3 font-serif text-2xl">{t("aLoginTitle")}</h1>
          <p className="mt-1 text-xs text-[#7e92a6]">Hokar Market Jewellery</p>
        </div>

        {(denied || state.error) && (
          <p role="alert" className="mb-4 rounded-md bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            {state.error ? t(state.error) : t("aLoginDenied")}
          </p>
        )}

        <label htmlFor="email" className="mb-1.5 block text-xs font-medium">
          {t("aEmail")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={state.email ?? ""}
          required
          maxLength={254}
          className={field}
        />

        <label htmlFor="password" className="mb-1.5 mt-4 block text-xs font-medium">
          {t("aPassword")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          className={field}
        />

        <button
          type="submit"
          disabled={pending}
          className="mt-6 flex min-h-11 w-full items-center justify-center rounded-md bg-[#526d84] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#40576b] disabled:opacity-60"
        >
          {pending ? t("aSigningIn") : t("aSignIn")}
        </button>

        <Link href="/" className="mt-4 block text-center text-xs text-[#7e92a6] hover:underline">
          ← {t("aBackToStore")}
        </Link>
      </form>
    </main>
  );
}
