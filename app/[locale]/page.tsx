// SPDX-FileCopyrightText: © 2026 Siemens AG
// SPDX-FileContributor: Dearsh Oberoi <dearsh.oberoi@siemens.com>
// SPDX-License-Identifier: GPL-2.0-only

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { getAuthOptions, isAuthConfigured } from "@/lib/auth";
import { getAuthConfiguration } from "@/lib/auth-configuration";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Suspense
      fallback={<main className="min-h-svh bg-[#100712]" aria-busy="true" />}
    >
      <AuthenticatedHome locale={locale} />
    </Suspense>
  );
}

async function AuthenticatedHome({ locale }: { locale: string }) {
  await connection();
  const authConfigured = isAuthConfigured();
  const session = authConfigured
    ? await getServerSession(getAuthOptions())
    : null;

  if (!session?.user?.id) redirect(`/${locale}/login`);

  const { mode, providerName } = getAuthConfiguration();

  return (
    <AppSidebar
      authConfigured={authConfigured}
      authMode={mode}
      providerName={providerName}
    />
  );
}
