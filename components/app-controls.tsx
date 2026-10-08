"use client";

import { useQueryClient } from "@tanstack/react-query";
import { signIn, signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { LogIn, LogOut, X } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { AuthMode } from "@/lib/auth-configuration";

export function AppControls({ authConfigured, authMode, providerName, variant = "header" }: {
  authConfigured: boolean;
  authMode: AuthMode | null;
  providerName: string;
  variant?: "header" | "sidebar";
}) {
  const locale = useLocale();
  const t = useTranslations("Controls");
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const authenticated = Boolean(session?.user?.id);
  const sidebar = variant === "sidebar";

  async function authenticate() {
    setPending(true);
    setError(false);

    try {
      const callbackUrl = window.location.href;
      queryClient.clear();
      if (authenticated) {
        await signOut({ callbackUrl });
      } else if (authMode === "credentials") {
        setFormOpen(true);
      } else {
        await signIn("oauth", { callbackUrl });
      }
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setPending(true);
    setError(false);
    setInvalidCredentials(false);
    try {
      const result = await signIn("credentials", {
        username: String(values.get("username") ?? ""),
        password: String(values.get("password") ?? ""),
        redirect: false,
        callbackUrl: window.location.href,
      });
      form.reset();
      if (result?.ok && !result.error) {
        queryClient.clear();
        setFormOpen(false);
        router.refresh();
      } else if (result?.error === "CredentialsSignin") {
        setInvalidCredentials(true);
      } else {
        setError(true);
      }
    } catch {
      form.reset();
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <header className={sidebar
      ? "flex w-full flex-col items-stretch gap-3 border-0 p-0 text-xs"
      : "flex w-full flex-wrap items-center justify-between gap-4 border-b border-zinc-200 p-4 text-sm dark:border-zinc-800"}>
      <label className={sidebar ? "flex items-center justify-between gap-2" : "flex items-center gap-2"}>
        {t("language")}
        <select
          value={locale}
          className={sidebar
            ? "rounded border border-[#69436f] bg-[#1a0b1e] px-2 py-1.5 text-[#f3e9f4]"
            : "rounded border border-zinc-300 bg-background p-2 dark:border-zinc-700"}
          onChange={(event) => {
            const nextLocale = event.target.value;
            if (nextLocale === "en" || nextLocale === "de") {
              router.replace(
                `${pathname}${window.location.search}${window.location.hash}`,
                { locale: nextLocale },
              );
            }
          }}
        >
          {routing.locales.map((language) => (
            <option key={language} value={language}>
              {language === "en" ? "English" : "Deutsch"}
            </option>
          ))}
        </select>
      </label>
      <div className={sidebar ? "flex flex-col items-stretch gap-2" : "flex flex-wrap items-center gap-3"}>
        {authenticated && !sidebar && (
          <span>
            {t("account", { name: session?.user.name ?? t("unknownUser") })}
          </span>
        )}
        <button
          type="button"
          disabled={!authConfigured || pending || status === "loading"}
          title={!authConfigured ? t("unavailable") : undefined}
          className={sidebar
            ? "flex items-center justify-center gap-2 rounded border border-[#69436f] px-3 py-2 text-[#f3e9f4] disabled:cursor-not-allowed disabled:opacity-50"
            : "flex items-center gap-2 rounded border border-zinc-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700"}
          onClick={authenticate}
        >
          {authenticated ? <LogOut size={16} aria-hidden="true" /> : <LogIn size={16} aria-hidden="true" />}
          {status === "loading"
            ? t("loading")
            : authenticated
              ? t("signOut")
              : authMode === "oauth"
                ? t("oauthSignIn", { provider: providerName })
                : t("signIn")}
        </button>
        {error && <p role="alert">{t("error")}</p>}
      </div>
      {formOpen && authMode === "credentials" && !authenticated && (
        <form onSubmit={submitCredentials} className="flex w-full flex-col items-stretch gap-3" aria-label={t("signIn")}>
          <label className="flex min-w-0 flex-col gap-1">
            {t("username")}
            <input name="username" autoComplete="username" required maxLength={254} disabled={pending} className="w-full rounded border border-zinc-300 bg-background p-2 dark:border-zinc-700" />
          </label>
          <label className="flex min-w-0 flex-col gap-1">
            {t("password")}
            <input name="password" type="password" autoComplete="current-password" required maxLength={4096} disabled={pending} className="w-full rounded border border-zinc-300 bg-background p-2 dark:border-zinc-700" />
          </label>
          <button type="submit" disabled={pending} className="flex items-center justify-center gap-2 rounded border border-[#69436f] px-3 py-2 disabled:opacity-50">
            <LogIn size={16} aria-hidden="true" />{pending ? t("signingIn") : t("signIn")}
          </button>
          <button type="button" disabled={pending} onClick={() => { setFormOpen(false); setInvalidCredentials(false); setError(false); }} aria-label={t("cancel")} title={t("cancel")} className="flex h-10 w-10 items-center justify-center rounded border border-[#69436f]">
            <X size={16} aria-hidden="true" />
          </button>
          {invalidCredentials && <p role="alert" className="w-full">{t("invalidCredentials")}</p>}
        </form>
      )}
    </header>
  );
}