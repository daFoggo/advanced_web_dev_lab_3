import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import type { ProxyAuthResult, ProxyOptions } from "./types"

/**
 * Entry used by each app's `proxy.ts`: reads the Neon Auth session.
 * Not `server-only`: the proxy runs outside the RSC graph.
 */
export async function updateSession(
  request: NextRequest,
  options?: ProxyOptions
): Promise<ProxyAuthResult> {
  return (await import("./neon-auth/proxy")).updateSession(request, options)
}

const CACHE_HEADERS = ["cache-control", "expires", "pragma"]

/**
 * A redirect built from scratch would drop the refreshed session cookies (single-use refresh tokens would be lost)
 * and the cache headers that stop a CDN from caching a `Set-Cookie`.
 */
export function redirectWithSession(url: URL, session: NextResponse) {
  const redirect = NextResponse.redirect(url)
  for (const cookie of session.cookies.getAll()) redirect.cookies.set(cookie)
  for (const name of CACHE_HEADERS) {
    const value = session.headers.get(name)
    if (value) redirect.headers.set(name, value)
  }
  const timing = session.headers.get("server-timing")
  if (timing) redirect.headers.set("Server-Timing", timing)
  return redirect
}
