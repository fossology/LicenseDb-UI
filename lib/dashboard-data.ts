// SPDX-FileCopyrightText: 2026 Siemens AG
// SPDX-License-Identifier: GPL-2.0-only

import type {
  BackendAudit,
  BackendDashboard,
  DashboardData,
} from "@/types/dashboard";

export function toDashboardData(
  dashboard: BackendDashboard | null | undefined,
  audits: BackendAudit[] | null | undefined,
): DashboardData {
  const [
    licensesCount,
    obligationsCount,
    usersCount,
    monthlyLicenseChangesCount,
  ] = [
    dashboard?.licenses_count,
    dashboard?.obligations_count,
    dashboard?.users_count,
    dashboard?.monthly_license_changes_count,
  ].map((value) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0
      ? value
      : 0,
  );

  const riskLicenseFrequency = Array.isArray(dashboard?.risk_license_frequency)
    ? dashboard.risk_license_frequency.flatMap((entry) => {
        if (
          !entry ||
          typeof entry !== "object" ||
          typeof entry.risk !== "number" ||
          !Number.isFinite(entry.risk)
        )
          return [];
        const count = entry.count;
        return [
          {
            risk: entry.risk,
            count:
              typeof count === "number" && Number.isFinite(count) && count >= 0
                ? count
                : 0,
          },
        ];
      })
    : [];

  const recentChanges = Array.isArray(audits)
    ? audits.map((audit) => {
        const user = audit?.user;
        return {
          actor:
            typeof user?.display_name === "string" && user.display_name.trim()
              ? user.display_name
              : typeof user?.user_name === "string" && user.user_name.trim()
                ? user.user_name
                : null,
          type: typeof audit?.type === "string" ? audit.type : null,
          timestamp:
            typeof audit?.timestamp === "string" ? audit.timestamp : null,
        };
      })
    : [];

  return {
    licensesCount,
    obligationsCount,
    usersCount,
    monthlyLicenseChangesCount,
    riskLicenseFrequency,
    recentChanges,
  };
}
