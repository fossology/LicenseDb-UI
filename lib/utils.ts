// SPDX-FileCopyrightText: © 2026 Siemens AG
// SPDX-FileContributor: Dearsh Oberoi <dearsh.oberoi@siemens.com>
// SPDX-License-Identifier: GPL-2.0-only

export { cn } from "cn";

export function formatTimestamp(timestamp: string | null) {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? "-"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
