"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { ADMIN_PATH, DASHBOARD_PATH, MY_DEADLINES_PATH } from "@/config/routes"

const TITLES: Record<string, string> = {
  [DASHBOARD_PATH]: "Tổng quan",
  [MY_DEADLINES_PATH]: "Deadline của tôi",
  [ADMIN_PATH]: "Quản trị",
}

export function AppBreadcrumb() {
  const pathname = usePathname()
  const pageTitle = TITLES[pathname] ?? "Dashboard"

  return (
    <Breadcrumb className="max-sm:hidden">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={DASHBOARD_PATH} />}>
            Lớp học
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
