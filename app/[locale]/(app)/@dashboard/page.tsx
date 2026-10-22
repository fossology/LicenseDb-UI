// SPDX-FileCopyrightText: © 2026 Siemens AG
// SPDX-FileContributor: Dearsh Oberoi <dearsh.oberoi@siemens.com>
// SPDX-License-Identifier: GPL-2.0-only

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Dashboard } from "@/components/dashboard";
import { getAuthOptions, isAuthConfigured } from "@/lib/auth";
import { getAuthConfiguration } from "@/lib/auth-configuration";
import { getDashboardData } from "@/lib/dashboard";
import type { DashboardData } from "@/types/dashboard";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <Suspense
      fallback={<main className="min-h-svh bg-[#100712]" aria-busy="true" />}
    >
      <AuthenticatedDashboard locale={locale} />
    </Suspense>
  );
}

async function AuthenticatedDashboard({ locale }: { locale: string }) {
  await connection();
  const authConfigured = isAuthConfigured();
  const authOptions = getAuthOptions();
  const session = authConfigured
    ? await getServerSession({
        ...authOptions,
        callbacks: {
          ...authOptions.callbacks,
          async session(params) {
            const userSession = await authOptions.callbacks!.session!(params);
            return {
              ...userSession,
              user: { ...userSession.user, id: params.token.sub ?? "" },
              backendAccessToken: params.token.backendTokens?.accessToken,
            };
          },
        },
      })
    : null;

  if (!session?.user?.id) redirect(`/${locale}/login`);

  const { mode, providerName } = getAuthConfiguration();
  const baseUrl = process.env.LICENSEDB_API_URL;
  let dashboard: DashboardData | null = null;
  if (baseUrl && session.backendAccessToken) {
    try {
      dashboard = await getDashboardData(baseUrl, session.backendAccessToken);
    } catch {
      dashboard = null;
    }
  }

  return (
    <AppSidebar
      authConfigured={authConfigured}
      authMode={mode}
      providerName={providerName}
    >
      <Dashboard data={dashboard} />
    </AppSidebar>
  );
}
