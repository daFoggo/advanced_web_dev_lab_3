"use client"

import Link from "next/link"
import { IconArrowRight, IconLayoutDashboard, IconSettings } from "@tabler/icons-react"

import { getAuthClient } from "@workspace/auth/client"
import { parseRole } from "@workspace/auth/permissions"
import { buttonVariants } from "@workspace/ui/components/button-variants"

import { ADMIN_PATH, DASHBOARD_PATH, DEADLINES_PATH, LOGIN_PATH } from "@/config/routes"

export function HomeHeroCta() {
  const authClient = getAuthClient()
  const { data, isPending } = authClient.useSession()

  if (isPending || !data?.user) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={DEADLINES_PATH}
          className={buttonVariants({
            size: "lg",
            className: "gap-2",
          })}
        >
          <span>Xem tất cả deadline</span>
          <IconArrowRight className="size-4" />
        </Link>
        <Link
          href={LOGIN_PATH}
          className={buttonVariants({
            size: "lg",
            variant: "outline",
          })}
        >
          Đăng nhập tài khoản
        </Link>
      </div>
    )
  }

  const user = data.user as { role?: string }
  const role = parseRole(user.role)

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={DASHBOARD_PATH}
        className={buttonVariants({
          size: "lg",
          className: "gap-2",
        })}
      >
        <IconLayoutDashboard className="size-4" />
        <span>Vào Dashboard của bạn</span>
        <IconArrowRight className="size-4" />
      </Link>
      {role === "admin" && (
        <Link
          href={ADMIN_PATH}
          className={buttonVariants({
            size: "lg",
            variant: "outline",
            className: "gap-2",
          })}
        >
          <IconSettings className="size-4" />
          <span>Khu vực Quản trị</span>
        </Link>
      )}
      <Link
        href={DEADLINES_PATH}
        className={buttonVariants({
          size: "lg",
          variant: "ghost",
        })}
      >
        Xem deadline công khai
      </Link>
    </div>
  )
}
