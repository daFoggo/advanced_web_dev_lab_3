import { Suspense } from "react"
import Link from "next/link"

import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ThemeToggle } from "@workspace/ui-patterns/theme-toggle"
import { AppLogo } from "@workspace/ui-patterns/app-logo"

import {
  AppSidebar,
  AppSidebarBody,
  AppSidebarSection,
} from "@/components/layout/sidebar/app-sidebar"
import { ColumnHeader } from "@/components/layout/column-header"
import { MainHeaderStart } from "@/components/layout/header/main-header-start"
import { Stagger } from "@/components/shared/stagger"
import { DASHBOARD_PATH, DEADLINES_PATH, HOME_PATH } from "@/config/routes"

import { AppBreadcrumb } from "./_components/app-breadcrumb"
import { AppHeaderAccount } from "./_components/app-header"
import { SessionAccount, SessionNav } from "./_components/session-nav"

/**
 * Unified app shell for all signed-in routes (`/dashboard`, `/dashboard/deadlines`, `/admin`).
 * Provides consistent sidebar navigation, breadcrumbs, and user management across the entire application.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar>
        <ColumnHeader className="overflow-hidden px-3">
          <Link href={DASHBOARD_PATH} className="flex shrink-0 items-center gap-2.5">
            <AppLogo variant="mark" />
            <span className="text-lg font-medium whitespace-nowrap group-data-[collapsible=icon]:invisible">
              Class Deadline Hub
            </span>
          </Link>
        </ColumnHeader>
        <AppSidebarBody>
          <Suspense fallback={<NavSkeleton />}>
            <SessionNav />
          </Suspense>
          <AppSidebarSection label="Tài khoản" pinned>
            <Suspense fallback={<Skeleton className="h-8" />}>
              <SessionAccount />
            </Suspense>
          </AppSidebarSection>
        </AppSidebarBody>
      </AppSidebar>
      <SidebarInset>
        <div className="flex h-svh min-w-0 flex-col">
          <ColumnHeader>
            <MainHeaderStart>
              <AppBreadcrumb />
            </MainHeaderStart>
            <div className="ml-auto flex items-center gap-3">
              <Link
                href={HOME_PATH}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground max-sm:hidden"
              >
                Trang chủ
              </Link>
              <Link
                href={DEADLINES_PATH}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground max-sm:hidden"
              >
                Deadline công khai
              </Link>
              <AppHeaderAccount />
              <ThemeToggle />
            </div>
          </ColumnHeader>
          <div className="no-scrollbar flex-1 overflow-y-auto">
            <Stagger className="flex flex-col gap-8 px-4 pt-10 pb-14 sm:px-8">
              {children}
            </Stagger>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function NavSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-6" />
      <Skeleton className="h-6" />
      <Skeleton className="h-6" />
    </div>
  )
}
