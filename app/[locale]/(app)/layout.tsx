// SPDX-FileCopyrightText: 2026 Siemens AG
// SPDX-License-Identifier: GPL-2.0-only

import type { ReactNode } from "react";

export default function AppLayout({
  children,
  dashboard,
}: {
  children: ReactNode;
  dashboard: ReactNode;
}) {
  return (
    <>
      {dashboard}
      {children}
    </>
  );
}
