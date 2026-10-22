"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  Cog,
  Lightbulb,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppControls } from "@/components/app-controls";
import { MainNavigation } from "@/components/main-navigation";
import type { AuthMode } from "@/lib/auth-configuration";

function CollapseControl({
  expandLabel,
  collapseLabel,
}: {
  expandLabel: string;
  collapseLabel: string;
}) {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const label = collapsed ? expandLabel : collapseLabel;

  return (
    <SidebarMenuButton
      type="button"
      tooltip={label}
      onClick={toggleSidebar}
      className="h-9 text-[#e8d8ec] hover:bg-[#35183b] hover:text-white"
    >
      {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
      <span>{label}</span>
    </SidebarMenuButton>
  );
}

export function AppSidebar({
  authConfigured,
  authMode,
  providerName,
}: {
  authConfigured: boolean;
  authMode: AuthMode | null;
  providerName: string;
}) {
  const t = useTranslations("Sidebar");
  const { data: session } = useSession();
  const profileName = session?.user?.name;

  return (
    <TooltipProvider delay={0}>
      <SidebarProvider
        className="licensedb-sidebar min-h-svh bg-[#100712]"
      >
        <Sidebar collapsible="icon" className="border-[#48234e]">
          <SidebarHeader className="gap-4 px-4 pt-6 pb-4">
            <div className="flex h-10 items-center gap-2.5 overflow-hidden px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <span aria-hidden="true" className="relative flex size-6 shrink-0 items-end justify-start text-[#ff334f]">
                <Lightbulb className="size-5" strokeWidth={2.8} />
                <Cog className="absolute top-0 right-0 size-2.5 fill-[#1a0b1e]" strokeWidth={3} />
              </span>
              <span className="truncate text-[25px] leading-none font-semibold text-white group-data-[collapsible=icon]:hidden">
                LicenseDb
              </span>
            </div>
            <SidebarSeparator className="mx-0 w-full bg-[#48234e]" />
          </SidebarHeader>

          <SidebarContent className="px-3">
            <MainNavigation />
          </SidebarContent>

          <SidebarFooter className="gap-3 px-4 pb-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <CollapseControl
                  expandLabel={t("expandSidebar")}
                  collapseLabel={t("collapseSidebar")}
                />
              </SidebarMenuItem>
            </SidebarMenu>
            {session?.user?.id ? (
              <details className="group/profile relative">
                <summary
                  className="flex min-h-[4.5rem] w-full min-w-0 cursor-pointer list-none items-center gap-3 rounded-md bg-[#57215e] px-3 py-2.5 text-left text-white transition-colors hover:bg-[#64266c] group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:min-h-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! [&::-webkit-details-marker]:hidden"
                  aria-label={t("profileLabel", { name: profileName ?? t("admin"), role: t("admin") })}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#35113b] text-xl font-medium text-white">
                    {(profileName ?? t("admin")).charAt(0).toUpperCase()}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-medium">{profileName ?? t("admin")}</span>
                    <span className="mt-0.5 text-xs text-[#ddc7e1]">{t("admin")}</span>
                  </span>
                  <ChevronDown className="size-4 shrink-0 transition-transform group-open/profile:rotate-180 group-data-[collapsible=icon]:hidden" />
                </summary>
                <div className="absolute bottom-full left-0 z-50 mb-2 max-h-[calc(100svh-10rem)] w-[calc(17.25rem-2rem)] overflow-y-auto rounded-md border border-[#48234e] bg-[#27102d] p-3 shadow-xl group-data-[collapsible=icon]:hidden">
                  <AppControls
                    authConfigured={authConfigured}
                    authMode={authMode}
                    providerName={providerName}
                    variant="sidebar"
                  />
                </div>
              </details>
            ) : (
              <div className="group-data-[collapsible=icon]:hidden">
                <AppControls
                  authConfigured={authConfigured}
                  authMode={authMode}
                  providerName={providerName}
                  variant="sidebar"
                />
              </div>
            )}
            <SidebarSeparator className="mx-0 w-full bg-[#48234e]" />
            <div className="truncate px-2 text-center text-xs text-[#bda9c1] group-data-[collapsible=icon]:px-0">
              2.0.0<span className="group-data-[collapsible=icon]:hidden">&nbsp;© 2026&nbsp; LicenseDb</span>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="relative min-h-svh flex-1 bg-[#100712]">
          <SidebarTrigger
            aria-label={t("openSidebar")}
            title={t("openSidebar")}
            className="fixed top-4 left-4 z-20 md:hidden"
          />
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}