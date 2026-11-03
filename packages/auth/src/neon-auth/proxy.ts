import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import type { ProxyAuthResult } from "../types"
import { getNeonAuth } from "./auth"

const VERIFIER_PARAM = "neon_auth_session_verifier"

/**
 * Optimistic only: a Neon Auth session cookie exists (`__Secure-` in front on HTTPS). The SDK refreshes and
 * validates the session when the DAL reads it; real authorization is never decided here.
 */
export async function updateSession(
  request: NextRequest
): Promise<ProxyAuthResult> {
  // Returning from Google: the SDK's middleware swaps the one-time verifier in the URL for the session cookies
  // and redirects to the same URL without it. It is the SDK's own (documented) path, so it is not re-implemented.
  if (request.nextUrl.searchParams.has(VERIFIER_PARAM)) {
    const exchanged = await getNeonAuth().middleware({
      loginUrl: "/sign-in",
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
  return { response, isAuthenticated: signedIn, role: null }
}
