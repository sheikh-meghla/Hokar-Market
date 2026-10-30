"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../components/language-provider";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import { signIn, signUp, type AuthField, type AuthState } from "./actions";

type Mode = "signin" | "signup";

function PasswordInput({
  id,
  name,
  autoComplete,
  invalid,
  describedBy,
}: {
  id: string;
  name: string;
  autoComplete: string;
  invalid: boolean;
  describedBy?: string;
}) {
  const { t } = useLanguage();
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        required
        maxLength={200}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-md border bg-white py-2.5 pl-3 pr-11 text-sm outline-none focus:border-[#526d84] ${invalid ? "border-rose-400" : "border-[#dfe6ec]"}`}
      />
      <button
        type="button"
        onClick={() => setShown(!shown)}
        aria-label={shown ? t("uHide") : t("uShow")}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#7e92a6] hover:text-[#526d84] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526d84]"
      >
        {shown ? <EyeOff size={17} /> : <Eye size={17} />}
      </button>
    </div>
  );
}

export default function AuthForm({
  mode,
  next,
  googleFailed = false,
}: {
  mode: Mode;
  next: string;
  googleFailed?: boolean;
}) {
  const { t } = useLanguage();
  const signup = mode === "signup";
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signup ? signUp : signIn,
    {},
  );

  const errors = state.fieldErrors ?? {};
  const text = (name: AuthField, label: Parameters<typeof t>[0], extra: {
    type?: string;
    autoComplete: string;
    inputMode?: "tel";
    required?: boolean;
  }) => (
    <div>
      <label htmlFor={`u-${name}`} className="mb-1.5 block text-xs font-medium">
        {t(label)}
      </label>
      <input
        id={`u-${name}`}
        name={name}
        type={extra.type ?? "text"}
        autoComplete={extra.autoComplete}
        inputMode={extra.inputMode}
        required={extra.required ?? true}
        maxLength={254}
        defaultValue={state.values?.[name as "name" | "email" | "phone"] ?? ""}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `u-${name}-error` : undefined}
        className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm outline-none focus:border-[#526d84] ${errors[name] ? "border-rose-400" : "border-[#dfe6ec]"}`}
      />
      {errors[name] && (
        <p id={`u-${name}-error`} className="mt-1 text-xs text-rose-600">
          {t(errors[name]!)}
        </p>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f6f8fa] text-[#263e55]">
      <SiteHeader />
      <div className="mx-auto flex max-w-md justify-center px-4 py-10 sm:py-14">
        <form
          // Remount after a failed submit so React's form reset keeps echoed values.
          key={state.values ? JSON.stringify(state.values) : "initial"}
          action={action}
          noValidate
          className="w-full rounded-xl border border-[#e3e9ee] bg-white p-6 shadow-sm sm:p-8"
        >
          <input type="hidden" name="next" value={next} />
          <h1 className="font-serif text-2xl">
            {t(signup ? "uSignUpTitle" : "uSignInTitle")}
          </h1>

          {googleFailed && !state.error && (
            <p role="alert" className="mt-4 rounded-md bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              {t("uErrGoogle")}
            </p>
          )}

          {state.error && (
            <p role="alert" className="mt-4 rounded-md bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              {t(state.error)}
            </p>
          )}

          <a
            href={`/auth/google${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="mt-5 flex min-h-11 w-full items-center justify-center gap-3 rounded-md border border-[#dfe6ec] bg-white px-4 py-2.5 text-sm font-semibold text-[#263e55] transition hover:bg-[#f6f8fa]"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
              <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
            {t("uContinueGoogle")}
          </a>

          <div className="mt-5 flex items-center gap-3 text-xs text-[#7e92a6]">
            <span className="h-px flex-1 bg-[#e3e9ee]" />
            {t("uOr")}
            <span className="h-px flex-1 bg-[#e3e9ee]" />
          </div>

          <div className="mt-5 space-y-4">
            {signup && text("name", "uFullName", { autoComplete: "name" })}
            {text("email", "uEmail", { type: "email", autoComplete: signup ? "email" : "username" })}
            {signup && text("phone", "uPhone", { type: "tel", inputMode: "tel", autoComplete: "tel", required: false })}

            <div>
              <label htmlFor="u-password" className="mb-1.5 block text-xs font-medium">
                {t("uPassword")}
              </label>
              <PasswordInput
                id="u-password"
                name="password"
                autoComplete={signup ? "new-password" : "current-password"}
                invalid={!!errors.password}
                describedBy="u-password-help"
              />
              {signup && (
                <p
                  id="u-password-help"
                  className={`mt-1 text-[11px] ${errors.password ? "text-rose-600" : "text-[#7e92a6]"}`}
                >
                  {errors.password ? t(errors.password) : t("uPasswordHint")}
                </p>
              )}
            </div>

            {signup && (
              <div>
                <label htmlFor="u-confirm" className="mb-1.5 block text-xs font-medium">
                  {t("uConfirmPassword")}
                </label>
                <PasswordInput
                  id="u-confirm"
                  name="confirm"
                  autoComplete="new-password"
                  invalid={!!errors.confirm}
                  describedBy={errors.confirm ? "u-confirm-error" : undefined}
                />
                {errors.confirm && (
                  <p id="u-confirm-error" className="mt-1 text-xs text-rose-600">
                    {t(errors.confirm)}
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-6 flex min-h-11 w-full items-center justify-center rounded-md bg-[#526d84] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#40576b] disabled:opacity-60"
          >
            {pending
              ? t(signup ? "uCreating" : "uSigningIn")
              : t(signup ? "uSignUp" : "uSignIn")}
          </button>

          <p className="mt-5 text-center text-sm text-[#6c8195]">
            {t(signup ? "uHaveAccount" : "uNoAccount")}{" "}
            <Link
              href={`${signup ? "/login" : "/signup"}${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="font-medium text-[#526d84] underline"
            >
              {t(signup ? "uSignIn" : "uSignUp")}
            </Link>
          </p>
        </form>
      </div>
      <SiteFooter />
    </main>
  );
}
