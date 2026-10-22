// SPDX-FileCopyrightText: 2026 Siemens AG
// SPDX-License-Identifier: GPL-2.0-only

import "server-only";
import { fetchJson } from "@/lib/api";
import { toDashboardData } from "@/lib/dashboard-data";
import type {
  BackendAudit,
  BackendDashboard,
  DashboardData,
} from "@/types/dashboard";

export async function getDashboardData(
  baseUrl: string,
  accessToken: string,
): Promise<DashboardData> {
  const apiUrl = baseUrl.replace(/\/+$/, "");
  const headers = { Authorization: `Bearer ${accessToken}` };
  const [dashboard, audits] = await Promise.all([
    fetchJson<{ data?: BackendDashboard | null }>(`${apiUrl}/dashboard`, {
      headers,
      cache: "no-store",
    }),
    fetchJson<{ data?: BackendAudit[] | null }>(
      `${apiUrl}/audits?limit=7&page=1`,
      {
        headers,
        cache: "no-store",
      },
    ),
  ]);

  return toDashboardData(dashboard.data, audits.data);
}
