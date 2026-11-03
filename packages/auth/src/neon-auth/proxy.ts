import { parseSetCookies, validateSessionData } from "@neon/auth/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { authConfig } from "../config"
import { parseRole, type SessionRole } from "../permissions"
import type { ProxyAuthResult, ProxyOptions } from "../types"
import { getNeonAuth } from "./auth"

const VERIFIER_PARAM = "neon_auth_session_verifier"

const SESSION_TOKEN_COOKIES = [
  "__Secure-neon-auth.session_token",
  "neon-auth.session_token",
]
const SESSION_DATA_COOKIES = [
  "__Secure-neon-auth.local.session_data",
  "neon-auth.local.session_data",
]

function firstCookie(request: NextRequest, names: string[]) {
  for (const name of names) {
    const value = request.cookies.get(name)?.value
    if (value) return value
  }
  return undefined
}

/**
 * Role from the signed `session_data` cache cookie (HS256 JWT, 5 min TTL, signed with NEON_AUTH_COOKIE_SECRET), only
 * when the session token cookie is there too (like the SDK). Bad signature, expired, missing: `null`.
 */
async function roleFromCookie(
  request: NextRequest
): Promise<SessionRole | null> {
  if (!firstCookie(request, SESSION_TOKEN_COOKIES)) return null
  const value = firstCookie(request, SESSION_DATA_COOKIES)
  if (!value) return null
  const result = await validateSessionData(
    value,
    authConfig.NEON_AUTH_COOKIE_SECRET
  )
  if (!result.valid || !result.payload?.user) return null
  return parseRole((result.payload.user as { role?: unknown }).role)
}

const SESSION_DATA_NAME = "neon-auth.local.session_data"

type MintedCookie = ReturnType<typeof parseSetCookies>[number]

/**
 * No readable role cookie: let the SDK's own middleware (documented path) call get-session, which mints a fresh
 * `session_data` cookie. Returns the role of that cookie and the cookies to forward, or `null` when the SDK cannot
 * mint one (revoked session, network): the page re-checks, so failing here is safe.
 */
async function mintRole(
  request: NextRequest
): Promise<{ role: SessionRole; cookies: MintedCookie[] } | null> {
  try {
    const minted = await getNeonAuth().middleware({
      loginUrl: "/login",
      publicRoutes: [],
    })(request)
    const cookies = minted.headers
      .getSetCookie()
      .flatMap((header) => parseSetCookies(header))
    const data = cookies.find((cookie) =>
      cookie.name.endsWith(SESSION_DATA_NAME)
    )
    if (!data?.value) return null
    const result = await validateSessionData(
      data.value,
      authConfig.NEON_AUTH_COOKIE_SECRET
    )
    if (!result.valid || !result.payload?.user) return null
    return {
      role: parseRole((result.payload.user as { role?: unknown }).role),
      cookies,
    }
  } catch {
    return null
  }
}

/**
 * Optimistic only: a Neon Auth session cookie exists (`__Secure-` in front on HTTPS). The SDK refreshes and
 * validates the session when the DAL reads it; real authorization is never decided here.
 */
export async function updateSession(
  request: NextRequest,
  options?: ProxyOptions
): Promise<ProxyAuthResult> {
  // Returning from Google: the SDK's middleware swaps the one-time verifier in the URL for the session cookies
  // and redirects to the same URL without it. It is the SDK's own (documented) path, so it is not re-implemented.
  if (request.nextUrl.searchParams.has(VERIFIER_PARAM)) {
    const exchanged = await getNeonAuth().middleware({
      loginUrl: "/login",
      publicRoutes: ["/"],
    })(request)
    return { response: exchanged, isAuthenticated: true, role: null }
  }

  const response = NextResponse.next({ request })
  const signedIn =
    request.cookies.has("__Secure-neon-auth.session_token") ||
    request.cookies.has("neon-auth.session_token") ||
    request.cookies.has("__Secure-neon-auth.local.session_data") ||
    request.cookies.has("neon-auth.local.session_data")
  let role = await roleFromCookie(request)
  if (
    role === null &&
    options?.mintRole &&
    firstCookie(request, SESSION_TOKEN_COOKIES)
  ) {
    const minted = await mintRole(request)
    if (minted) {
      role = minted.role
      // Through `response.cookies` (not raw headers) so `redirectWithSession` carries them into a redirect.
      for (const { name, value, ...options } of minted.cookies) {
        response.cookies.set(name, value, options)
      }
    }
  }
  return { response, isAuthenticated: signedIn, role }
}
