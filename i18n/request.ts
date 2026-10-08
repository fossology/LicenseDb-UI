import { locale as getRootLocale } from "next/root-params";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

const messages = {
  en: () => import("@/messages/en.json").then((module) => module.default),
  de: () => import("@/messages/de.json").then((module) => module.default),
};

export default getRequestConfig(async ({ locale }) => {
  const requestedLocale = locale ?? (await getRootLocale());

  if (!hasLocale(routing.locales, requestedLocale)) {
    notFound();
  }

  return {
    locale: requestedLocale,
    messages: await messages[requestedLocale](),
    timeZone: "UTC",
  };
});