// SPDX-FileCopyrightText: 2026 Siemens AG
// SPDX-License-Identifier: GPL-2.0-only

export type BackendDashboard = {
  licenses_count?: number | null;
  obligations_count?: number | null;
  users_count?: number | null;
  monthly_license_changes_count?: number | null;
  risk_license_frequency?: Array<{ risk: number; count: number | null }> | null;
};

export type BackendAudit = {
  timestamp?: string | null;
  type?: string | null;
  user?: { display_name?: string | null; user_name?: string | null } | null;
};

export type DashboardData = {
  licensesCount: number;
  obligationsCount: number;
  usersCount: number;
  monthlyLicenseChangesCount: number;
  riskLicenseFrequency: Array<{ risk: number; count: number }>;
  recentChanges: Array<{
    actor: string | null;
    type: string | null;
    timestamp: string | null;
  }>;
};
