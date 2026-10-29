"use client";

import {
  FileText,
  MessageSquareMore,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslations } from "next-intl";

type DashboardData = {
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

const chartColors = ["#7b1a89", "#9ebc45", "#db8a34", "#6094bf", "#d76078"];

async function getDashboardData() {
  const response = await fetch("/api/dashboard", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load dashboard data");
  const payload = (await response.json()) as { data: DashboardData };
  return payload.data;
}

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function Dashboard() {
  const t = useTranslations("Dashboard");
  const [selectedType, setSelectedType] = useState("all");
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardData,
    staleTime: 30_000,
  });
  const data = dashboardQuery.data;
  const metrics = [
    {
      label: t("licenses"),
      value: data?.licensesCount,
      action: t("viewLicenses"),
      icon: FileText,
    },
    {
      label: t("obligations"),
      value: data?.obligationsCount,
      action: t("viewObligations"),
      icon: ShieldCheck,
    },
    {
      label: t("users"),
      value: data?.usersCount,
      action: t("viewUsers"),
      icon: UsersRound,
    },
    {
      label: t("licenseChanges"),
      value: data?.monthlyLicenseChangesCount,
      action: t("viewLicenseChanges"),
      icon: MessageSquareMore,
    },
  ];
  const changeTypes = [
    ...new Set(
      data?.recentChanges.flatMap((change) =>
        change.type ? [change.type] : [],
      ) ?? [],
    ),
  ];
  const recentChanges =
    data?.recentChanges.filter(
      (change) => selectedType === "all" || change.type === selectedType,
    ) ?? [];
  const licenseSegments =
    data?.riskLicenseFrequency.map((segment, index) => ({
      ...segment,
      color: chartColors[index % chartColors.length],
      percentage: data.licensesCount
        ? (segment.count / data.licensesCount) * 100
        : 0,
    })) ?? [];

  return (
    <div className="min-h-svh bg-[#f7f7f8] text-[#26212a]">
      <header className="flex min-h-16 items-center justify-between gap-4 border-b border-[#e5e1e6] bg-white px-5 py-3 sm:px-8">
        <h1 className="text-xl font-semibold text-[#221b25]">{t("title")}</h1>
        <label className="relative block w-full max-w-56">
          <span className="sr-only">{t("search")}</span>
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#847b86]"
          />
          <input
            type="search"
            placeholder={t("search")}
            className="h-8 w-full rounded border border-[#d9d4db] bg-white pr-3 pl-8 text-xs text-[#27212b] outline-none placeholder:text-[#a29aa4] focus:border-[#7b1a89] focus:ring-2 focus:ring-[#7b1a89]/15"
          />
        </label>
      </header>

      <div className="mx-auto w-full max-w-7xl p-5 sm:p-8">
        <section
          aria-label={t("summary")}
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          {metrics.map(({ label, value, action, icon: Icon }) => (
            <article
              key={label}
              className="min-h-28 rounded-md border border-[#e2dde3] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold leading-none text-[#211a24]">
                    {dashboardQuery.isLoading ? "-" : value}
                  </p>
                  <p className="mt-1 text-xs text-[#756b78]">{label}</p>
                </div>
                <span className="flex size-8 items-center justify-center rounded bg-[#7b1a89] text-white">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
              </div>
              <span className="mt-4 inline-flex text-xs font-medium text-[#6d1678]">
                {action} <span aria-hidden="true">&nbsp;&gt;</span>
              </span>
            </article>
          ))}
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <article className="overflow-hidden rounded-md border border-[#e2dde3] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeeaf0] px-4 py-3">
              <h2 className="text-sm font-semibold text-[#29232c]">
                {t("recentChanges")}
              </h2>
              <label className="relative">
                <span className="sr-only">{t("changeType")}</span>
                <select
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value)}
                  className="h-7 rounded border border-[#d8d2da] bg-white px-2 text-xs text-[#5e5661] outline-none focus:border-[#7b1a89] focus:ring-2 focus:ring-[#7b1a89]/15"
                >
                  <option value="all">{t("allTypes")}</option>
                  {changeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {dashboardQuery.isError ? (
              <p className="px-4 py-6 text-sm text-[#9c3b47]">
                {t("unavailable")}
              </p>
            ) : recentChanges.length ? (
              <ul className="divide-y divide-[#eeeaf0] px-4">
                {recentChanges.map((change, index) => (
                  <li
                    key={`${change.actor}-${change.timestamp}-${index}`}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f5e8f7] text-[#7b1a89]">
                      <MessageSquareMore
                        aria-hidden="true"
                        className="size-3"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[#312a34]">
                        {change.actor ?? t("unknownUser")}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#8b828d]">
                        {t("changedEntity", {
                          entity: change.type ?? t("item"),
                        })}
                      </p>
                    </div>
                    <time
                      className="text-right text-[10px] leading-4 text-[#8b828d]"
                      dateTime={change.timestamp ?? undefined}
                    >
                      {formatTimestamp(change.timestamp)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-[#756b78]">
                {dashboardQuery.isLoading ? t("loading") : t("noRecentChanges")}
              </p>
            )}
          </article>

          <article className="rounded-md border border-[#e2dde3] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-[#29232c]">
              {t("licensesTotal", { count: data?.licensesCount ?? 0 })}
            </h2>
            <div className="mx-auto mt-4 grid max-w-xs justify-items-center">
              <svg
                viewBox="0 0 42 42"
                className="size-44 -rotate-90"
                role="img"
                aria-label={t("licensesTotal", {
                  count: data?.licensesCount ?? 0,
                })}
              >
                <circle
                  cx="21"
                  cy="21"
                  r="15.9155"
                  fill="none"
                  stroke="#f0eef1"
                  strokeWidth="7"
                />
                {licenseSegments.map((segment, index) => {
                  const offset = licenseSegments
                    .slice(0, index)
                    .reduce(
                      (total, previous) => total + previous.percentage,
                      0,
                    );
                  return (
                    <circle
                      key={segment.risk}
                      cx="21"
                      cy="21"
                      r="15.9155"
                      fill="none"
                      stroke={segment.color}
                      strokeWidth="7"
                      strokeDasharray={`${segment.percentage} ${100 - segment.percentage}`}
                      strokeDashoffset={-offset}
                    />
                  );
                })}
              </svg>
              {licenseSegments.length ? (
                <ul className="mt-3 w-full space-y-2">
                  {licenseSegments.map((segment) => (
                    <li
                      key={segment.risk}
                      className="flex items-center justify-between gap-3 text-[11px] text-[#6b626e]"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        {t("riskLevel", { risk: segment.risk })}
                      </span>
                      <span className="shrink-0 text-[#514855]">
                        {segment.count} ({segment.percentage.toFixed(1)}%)
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-[#756b78]">
                  {dashboardQuery.isLoading
                    ? t("loading")
                    : t("noLicenseDistribution")}
                </p>
              )}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
