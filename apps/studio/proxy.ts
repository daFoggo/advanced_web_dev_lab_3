import type { NextRequest } from "next/server"

import { can } from "@workspace/auth/permissions"
import { redirectWithSession, updateSession } from "@workspace/auth/proxy"

import { AUTH_OPTIONS } from "@/config/auth"
import {
  ADMIN_PREFIX,
  AUTH_PAGES,
  DASHBOARD_PATH,
  FORBIDDEN_PATH,
  LOGIN_PATH,
  PROTECTED_PREFIXES,
} from "@/config/routes"
import { safeCallbackUrl } from "@/lib/safe-redirect"

const under = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`)

/**
 * 1) Read/refresh the session so Server Components see fresh tokens.
 * 2) Optimistic redirects. Signed out on a protected path: /login?callbackUrl=<path>. A session whose role is
 *    known (signed `session_data` cookie) and cannot create deadlines: /403 for /admin*. Role unknown
 *    (`null`: cookie expired or not minted yet) passes through: the page re-checks (`app/(app)/admin/page.tsx`).
 *    Real authorization is in the DAL, pages and actions.
 * 3) Emits Server-Timing header for Chrome DevTools Network profiling.
 */
export async function proxy(request: NextRequest) {
  const start = performance.now()
  // /admin* decides on the role, so make sure the proxy can see it (mints the 5-minute role cookie if it lapsed).
  const { response, isAuthenticated, role } = await updateSession(request, {
    ...AUTH_OPTIONS,
    mintRole: under(request.nextUrl.pathname, ADMIN_PREFIX),
  })
  const duration = Math.max(0, performance.now() - start).toFixed(2)
  response.headers.set(
    "Server-Timing",
    `proxy;dur=${duration};desc="Proxy Auth Check"`
  )

  const { pathname, search } = request.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((prefix) => under(pathname, prefix))
  if (isProtected && !isAuthenticated) {
    const login = new URL(LOGIN_PATH, request.url)
    login.searchParams.set("callbackUrl", safeCallbackUrl(`${pathname}${search}`))
    return redirectWithSession(login, response)
  }
  if (
    isAuthenticated &&
    role !== null &&
    under(pathname, ADMIN_PREFIX) &&
    !can(role, "deadline:create")
  ) {
    return redirectWithSession(new URL(FORBIDDEN_PATH, request.url), response)
  }
  if (
    isAuthenticated &&
    (AUTH_PAGES as readonly string[]).includes(pathname) &&
    !request.nextUrl.searchParams.has("switch")
  ) {
    return redirectWithSession(new URL(DASHBOARD_PATH, request.url), response)
  }
  // Public chưa login thì xem trang thường; đã đăng nhập (có role) thì vào thẳng dashboard
  if (isAuthenticated && pathname === "/") {
    return redirectWithSession(new URL(DASHBOARD_PATH, request.url), response)
  }
  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|__nextjs_font|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)",
  ],
}
