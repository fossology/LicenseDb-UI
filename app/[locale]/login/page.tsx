import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Lightbulb, ShieldCheck } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginForm } from "@/components/login-form";
import { routing } from "@/i18n/routing";
import { getAuthOptions, isAuthConfigured } from "@/lib/auth";
import { getAuthConfiguration } from "@/lib/auth-configuration";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "Login" });
  const { mode, providerName } = getAuthConfiguration();
  const authConfigured = isAuthConfigured();

  return (
    <Suspense fallback={<LoginFallback title={t("title")} />}>
      <LoginContent
        locale={locale}
        authConfigured={authConfigured}
        authMode={mode}
        providerName={providerName}
      />
    </Suspense>
  );
}

async function LoginContent({
  locale,
  authConfigured,
  authMode,
  providerName,
}: {
  locale: (typeof routing.locales)[number];
  authConfigured: boolean;
  authMode: ReturnType<typeof getAuthConfiguration>["mode"];
  providerName: string;
}) {
  if (authConfigured) {
    await connection();
    const session = await getServerSession(getAuthOptions());
    if (session?.user?.id) redirect(`/${locale}`);
  }

  const t = await getTranslations({ locale, namespace: "Login" });

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#100712] px-5 py-10 text-[#f3e9f4] [font-family:var(--font-geist-sans)]">
      <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-[32%] border-r border-[#48234e]/70 bg-[#1a0b1e] lg:block" />
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher variant="login" />
      </div>
      <section className="relative z-10 w-full max-w-[26rem]">
        <div className="mb-8 flex items-center justify-center gap-3 lg:justify-start">
          <span className="flex size-11 items-center justify-center rounded-md border border-[#69436f] bg-[#27102d]">
            <Lightbulb aria-hidden="true" className="size-5 text-[#ff334f]" strokeWidth={2.5} />
          </span>
          <span className="text-2xl font-semibold text-white">LicenseDb</span>
        </div>
        <div className="rounded-lg border border-[#48234e] bg-[#1a0b1e] p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div className="mb-7">
            <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-[#35163a] text-[#e7c8eb]">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </div>
            <h1 className="text-2xl font-semibold text-white">{t("title")}</h1>
            <p className="mt-2 text-sm leading-6 text-[#c5b2ca]">{t("description")}</p>
          </div>
          <LoginForm
            authConfigured={authConfigured}
            authMode={authMode}
            providerName={providerName}
          />
        </div>
        <p className="mt-6 text-center text-xs text-[#9c88a1]">
          © 2026 LicenseDb
        </p>
      </section>
    </main>
  );
}

function LoginFallback({ title }: { title: string }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#100712] px-5 text-[#f3e9f4] [font-family:var(--font-geist-sans)]">
      <section className="w-full max-w-[26rem] rounded-lg border border-[#48234e] bg-[#1a0b1e] p-8" aria-busy="true">
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        <div className="mt-6 h-11 animate-pulse rounded-md bg-[#35163a]" />
        <div className="mt-4 h-11 animate-pulse rounded-md bg-[#35163a]" />
      </section>
    </main>
  );
}