"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { IconLayoutDashboard, IconLogout, IconSettings } from "@tabler/icons-react"

import { getAuthClient } from "@workspace/auth/client"
import { ROLE_LABEL, parseRole } from "@workspace/auth/permissions"
import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { ADMIN_PATH, DASHBOARD_PATH, HOME_PATH, LOGIN_PATH } from "@/config/routes"
import { safeCallbackUrl } from "@/lib/safe-redirect"

/**
 * Header account area of the public pages. A client island (the session is read in the browser through
 * `/api/auth/get-session`), so the server tree of `(public)` never touches cookies and stays static.
 */
export function AuthStatus() {
  const authClient = getAuthClient()
  const { data, isPending, refetch } = authClient.useSession()
  const router = useRouter()
  const pathname = usePathname()

  // The session store outlives navigations: a sign-in done by a Server Action elsewhere is not visible to it.
  useEffect(() => {
    void refetch()
  }, [refetch])

  if (isPending) return <AuthStatusSkeleton />

  if (!data?.user) {
    const callbackUrl = safeCallbackUrl(pathname)
    return (
      <Link
        href={`${LOGIN_PATH}?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Đăng nhập
      </Link>
    )
  }

  const user = data.user as { name?: string; email?: string; role?: string }
  const role = parseRole(user.role)

  return (
    <div className="flex items-center gap-2">
      <Link
        href={DASHBOARD_PATH}
        className={buttonVariants({ variant: "default", size: "sm", className: "gap-1.5" })}
      >
        <IconLayoutDashboard className="size-3.5" />
        <span>Vào Dashboard</span>
      </Link>
      {role === "admin" && (
        <Link
          href={ADMIN_PATH}
          className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
        >
          <IconSettings className="size-3.5" />
          <span>Quản trị</span>
        </Link>
      )}
      <Badge variant="secondary" className="max-sm:hidden">
        {ROLE_LABEL[role]}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
        onClick={async () => {
          await authClient.signOut()
          router.push(HOME_PATH)
          router.refresh()
        }}
      >
        <IconLogout className="size-3.5 sm:hidden" />
        <span className="max-sm:hidden">Đăng xuất</span>
      </Button>
    </div>
  )
}

export function AuthStatusSkeleton() {
  return <Skeleton className="h-8 w-24" />
}
