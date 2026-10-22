import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { ApiError, fetchJson } from "@/lib/api";

type BackendDashboard = {
  licenses_count?: unknown;
  obligations_count?: unknown;
  users_count?: unknown;
  monthly_license_changes_count?: unknown;
  risk_license_frequency?: unknown;
};

type BackendAudit = {
  timestamp?: unknown;
  type?: unknown;
  user?: { display_name?: unknown; user_name?: unknown };
};

function asCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

function asRiskFrequency(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const { risk, count } = entry as Record<string, unknown>;
    if (typeof risk !== "number" || !Number.isFinite(risk)) return [];
    return [{ risk, count: asCount(count) }];
  });
}

function asRecentChanges(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.map((entry) => {
    const audit = entry as BackendAudit;
    const user = audit.user;
    return {
      actor: typeof user?.display_name === "string" && user.display_name.trim()
        ? user.display_name
        : typeof user?.user_name === "string" && user.user_name.trim()
          ? user.user_name
          : null,
      type: typeof audit.type === "string" ? audit.type : null,
      timestamp: typeof audit.timestamp === "string" ? audit.timestamp : null,
    };
  });
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const accessToken = token?.backendTokens?.accessToken;
  const baseUrl = process.env.LICENSEDB_API_URL;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!baseUrl) {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }

  const headers = { Authorization: `Bearer ${accessToken}` };
  const apiUrl = baseUrl.replace(/\/+$/, "");

  try {
    const [dashboard, audits] = await Promise.all([
      fetchJson<{ data?: BackendDashboard }>(`${apiUrl}/dashboard`, {
        headers,
        cache: "no-store",
      }),
      fetchJson<{ data?: BackendAudit[] }>(`${apiUrl}/audits?limit=7&page=1`, {
        headers,
        cache: "no-store",
      }),
    ]);

    return NextResponse.json({
      data: {
        licensesCount: asCount(dashboard.data?.licenses_count),
        obligationsCount: asCount(dashboard.data?.obligations_count),
        usersCount: asCount(dashboard.data?.users_count),
        monthlyLicenseChangesCount: asCount(dashboard.data?.monthly_license_changes_count),
        riskLicenseFrequency: asRiskFrequency(dashboard.data?.risk_license_frequency),
        recentChanges: asRecentChanges(audits.data),
      },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 502;
    return NextResponse.json({ error: "Unable to load dashboard data" }, { status });
  }
}