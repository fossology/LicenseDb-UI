"use client";

import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, type SubmitEvent } from "react";
import { ArrowRight, KeyRound, LoaderCircle, UserRound } from "lucide-react";
import type { AuthMode } from "@/lib/auth-configuration";

export function LoginForm({
  authConfigured,
  authMode,
  providerName,
}: {
  authConfigured: boolean;
  authMode: AuthMode | null;
  providerName: string;
}) {
  const t = useTranslations("Login");
  const locale = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<"credentials" | "general" | null>(null);

  async function submitCredentials(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        username: String(values.get("username") ?? ""),
        password: String(values.get("password") ?? ""),
        redirect: false,
        callbackUrl: `${window.location.origin}/${locale}`,
      });

      if (result?.ok && !result.error) {
        router.replace("/");
        router.refresh();
      } else if (result?.error === "CredentialsSignin") {
        setError("credentials");
      } else {
        setError("general");
      }
    } catch {
      setError("general");
    } finally {
      setPending(false);
    }
  }

  async function submitOAuth() {
    setPending(true);
    setError(null);
    try {
      await signIn("oauth", {
        callbackUrl: `${window.location.origin}/${locale}`,
      });
    } catch {
      setError("general");
      setPending(false);
    }
  }

  if (authMode === "credentials") {
    return (
      <form onSubmit={submitCredentials} className="space-y-5">
        <label className="block space-y-2 text-sm font-medium text-[#f3e9f4]">
          <span>{t("username")}</span>
          <span className="flex h-11 items-center gap-3 rounded-md border border-[#69436f] bg-[#17091b] px-3 focus-within:border-[#c982d1] focus-within:ring-2 focus-within:ring-[#c982d1]/30">
            <UserRound aria-hidden="true" className="size-4 text-[#bda9c1]" />
            <input
              name="username"
              autoComplete="username"
              required
              maxLength={254}
              disabled={!authConfigured || pending}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8d7b91]"
            />
          </span>
        </label>
        <label className="block space-y-2 text-sm font-medium text-[#f3e9f4]">
          <span>{t("password")}</span>
          <span className="flex h-11 items-center gap-3 rounded-md border border-[#69436f] bg-[#17091b] px-3 focus-within:border-[#c982d1] focus-within:ring-2 focus-within:ring-[#c982d1]/30">
            <KeyRound aria-hidden="true" className="size-4 text-[#bda9c1]" />
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={4096}
              disabled={!authConfigured || pending}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8d7b91]"
            />
          </span>
        </label>
        {error && (
          <p role="alert" className="text-sm text-[#ff9aaa]">
            {error === "credentials" ? t("invalidCredentials") : t("error")}
          </p>
        )}
        {!authConfigured && (
          <p role="status" className="text-sm text-[#ddc7e1]">
            {t("unavailable")}
          </p>
        )}
        <button
          type="submit"
          disabled={!authConfigured || pending}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#75247d] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#852b8e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c982d1] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <ArrowRight aria-hidden="true" className="size-4" />
          )}
          {pending ? t("signingIn") : t("submit")}
        </button>
      </form>
    );
  }

  if (authMode === "oauth") {
    return (
      <div className="space-y-5">
        {error && (
          <p role="alert" className="text-sm text-[#ff9aaa]">
            {t("error")}
          </p>
        )}
        {!authConfigured && (
          <p role="status" className="text-sm text-[#ddc7e1]">
            {t("unavailable")}
          </p>
        )}
        <button
          type="button"
          disabled={!authConfigured || pending}
          onClick={submitOAuth}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#75247d] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#852b8e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c982d1] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <ArrowRight aria-hidden="true" className="size-4" />
          )}
          {pending ? t("signingIn") : t("oauthSignIn", { provider: providerName })}
        </button>
      </div>
    );
  }

  return (
    <p role="status" className="text-sm text-[#ddc7e1]">
      {t("unavailable")}
    </p>
  );
}