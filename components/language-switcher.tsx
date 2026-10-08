"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher({
  variant = "default",
}: {
  variant?: "default" | "sidebar" | "login";
}) {
  const locale = useLocale();
  const t = useTranslations("Controls");
  const pathname = usePathname();
  const router = useRouter();
  const sidebar = variant === "sidebar";
  const login = variant === "login";

  return (
    <label
      className={sidebar
        ? "flex items-center justify-between gap-2"
        : login
          ? "flex items-center gap-3 text-sm text-[#e8d8ec]"
          : "flex items-center gap-2"}
    >
      <span className={login ? "sr-only" : undefined}>{t("language")}</span>
      <select
        value={locale}
        aria-label={t("language")}
        className={sidebar
          ? "rounded border border-[#69436f] bg-[#1a0b1e] px-2 py-1.5 text-[#f3e9f4]"
          : login
            ? "rounded-md border border-[#69436f] bg-[#1a0b1e] px-3 py-2 text-[#f3e9f4]"
            : "rounded border border-zinc-300 bg-background p-2 dark:border-zinc-700"}
        onChange={(event) => {
          const nextLocale = event.target.value as (typeof routing.locales)[number];
          if (routing.locales.includes(nextLocale)) {
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
  );
}