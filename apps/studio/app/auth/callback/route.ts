import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { DASHBOARD_PATH, SIGN_IN_PATH } from "@/config/routes"
import { getAuthProvider } from "@/lib/auth"
import { publicEnv } from "@/lib/env.public"

/** OAuth redirect target (PKCE): exchanges `?code=` for a session cookie. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  // `request.nextUrl.origin` can be the internal host behind a reverse proxy; use the public URL.
  const origin = publicEnv.NEXT_PUBLIC_APP_URL
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  // Neon Auth finishes in `proxy.ts` (it swaps the verifier for cookies before this route runs): a session
  // here means the flow succeeded, with no `code` to exchange.
  if (!code) {
    const session = await (await getAuthProvider()).getSession()
    if (session) return NextResponse.redirect(new URL(DASHBOARD_PATH, origin))
    // Why the flow ended without a session: the provider's own error, and which cookies this request carried
    // (names only, never values).
    console.warn("[auth/callback] no session after OAuth", {
      query: Object.fromEntries(
        [...searchParams].filter(
          ([key]) => key !== "neon_auth_session_verifier"
        )
      ),
      hadVerifier: searchParams.has("neon_auth_session_verifier"),
      cookies: request.cookies.getAll().map((cookie) => cookie.name),
    })
  }

  if (code) {
    try {
      const provider = await getAuthProvider()
      if (provider.oauth) {
        await provider.oauth.exchangeCode(code, state)
        return NextResponse.redirect(new URL(DASHBOARD_PATH, origin))
      }
    } catch {
      // fall through to the error redirect
    }
  }
  return NextResponse.redirect(new URL(`${SIGN_IN_PATH}?error=oauth`, origin))
}
