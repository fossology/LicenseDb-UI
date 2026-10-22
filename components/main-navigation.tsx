"use client";

import {
  ChevronRight,
  FileCheck2,
  LayoutDashboard,
  ScrollText,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavigationItem = {
  key: "dashboard" | "users" | "license" | "obligation" | "manageClients";
  href?: "/";
  icon: LucideIcon;
  hasSubmenu?: boolean;
};

const navigationItems: readonly NavigationItem[] = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  { key: "users", icon: UserRound },
  { key: "license", icon: ScrollText, hasSubmenu: true },
  { key: "obligation", icon: FileCheck2, hasSubmenu: true },
  { key: "manageClients", icon: UsersRound },
];

export function MainNavigation() {
  const t = useTranslations("Sidebar");
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation">
      <SidebarMenu className="gap-1">
        {navigationItems.map(({ key, href, icon: Icon, hasSubmenu }) => {
          const active = href === pathname;
          const className = active
            ? "h-10 text-[#f1e6f3] data-active:bg-[#35163a] data-active:text-white"
            : "h-10 text-[#e8d8ec] hover:bg-[#35183b] hover:text-white";

          return (
            <SidebarMenuItem key={key}>
              <SidebarMenuButton
                {...(href
                  ? {
                      render: <Link href={href} aria-current={active ? "page" : undefined} />,
                    }
                  : { type: "button" })}
                isActive={active}
                tooltip={t(key)}
                className={className}
              >
                <Icon />
                <span>{t(key)}</span>
                {hasSubmenu ? <ChevronRight className="ml-auto size-4 group-data-[collapsible=icon]:hidden" /> : null}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}