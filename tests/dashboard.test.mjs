// SPDX-FileCopyrightText: 2026 Siemens AG
// SPDX-License-Identifier: GPL-2.0-only

import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";
import { toDashboardData } from "../lib/dashboard-data.ts";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export {}", shortCircuit: true };
    }
    if (specifier.startsWith("@/")) {
      return nextResolve(
        new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href,
        context,
      );
    }
    return nextResolve(specifier, context);
  },
});

const { getDashboardData } = await import("../lib/dashboard.ts");

test("server dashboard loader authenticates both backend requests", async (context) => {
  const requests = [];
  context.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url, options });
    return Response.json(
      url.endsWith("/dashboard")
        ? { data: { licenses_count: 3 } }
        : { data: [{ user: { user_name: "alice" }, type: "license" }] },
    );
  });

  const data = await getDashboardData("https://backend.example/api/", "secret");

  assert.equal(data.licensesCount, 3);
  assert.equal(data.recentChanges[0].actor, "alice");
  assert.deepEqual(requests.map((request) => request.url).sort(), [
    "https://backend.example/api/audits?limit=7&page=1",
    "https://backend.example/api/dashboard",
  ]);
  for (const { options } of requests) {
    assert.equal(
      new Headers(options.headers).get("authorization"),
      "Bearer secret",
    );
    assert.equal(options.cache, "no-store");
  }
});

test("server dashboard loader propagates backend failures", async (context) => {
  context.mock.method(globalThis, "fetch", async () =>
    Response.json({ error: "Unavailable" }, { status: 503 }),
  );
  await assert.rejects(getDashboardData("https://backend.example", "secret"), {
    status: 503,
  });
});

test("dashboard data maps backend counts, risks and audit users", () => {
  assert.deepEqual(
    toDashboardData(
      {
        licenses_count: 4,
        obligations_count: 2,
        users_count: 3,
        monthly_license_changes_count: 1,
        risk_license_frequency: [{ risk: 2, count: 4 }],
      },
      [
        {
          user: { display_name: "Alice", user_name: "alice" },
          type: "license",
          timestamp: "2026-01-01",
        },
      ],
    ),
    {
      licensesCount: 4,
      obligationsCount: 2,
      usersCount: 3,
      monthlyLicenseChangesCount: 1,
      riskLicenseFrequency: [{ risk: 2, count: 4 }],
      recentChanges: [
        { actor: "Alice", type: "license", timestamp: "2026-01-01" },
      ],
    },
  );
});

test("dashboard data handles missing and malformed backend values", () => {
  assert.deepEqual(
    toDashboardData(
      {
        licenses_count: -1,
        obligations_count: "2",
        users_count: null,
        monthly_license_changes_count: NaN,
        risk_license_frequency: [
          null,
          { risk: "bad", count: 2 },
          { risk: 1, count: -5 },
        ],
      },
      [
        {
          user: { display_name: " ", user_name: "alice" },
          type: 42,
          timestamp: null,
        },
        null,
      ],
    ),
    {
      licensesCount: 0,
      obligationsCount: 0,
      usersCount: 0,
      monthlyLicenseChangesCount: 0,
      riskLicenseFrequency: [{ risk: 1, count: 0 }],
      recentChanges: [
        { actor: "alice", type: null, timestamp: null },
        { actor: null, type: null, timestamp: null },
      ],
    },
  );
  assert.deepEqual(toDashboardData(null, null).riskLicenseFrequency, []);
});
