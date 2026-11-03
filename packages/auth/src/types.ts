import type { NextResponse } from "next/server"

import type { SessionRole } from "./permissions"

/** Per-app settings. Each app has its own cookie so web and admin sessions stay apart (both run on localhost in dev). */
export type AuthOptions = { cookieName: string }

/** Per-request options of the proxy's `updateSession`. */
export type ProxyOptions = AuthOptions & {
  /**
   * The signed role cookie (`session_data`, 5 min) can be missing or expired, which hides the role from the proxy.
   * With this set, a signed-in request without a readable role asks the SDK to mint a fresh one (one upstream call,
   * then cached for 5 min). Use it for the paths whose redirect depends on the role (`/admin*`).
   */
  mintRole?: boolean
}

/**
 * Session. `accessToken` goes to the data backend (Neon Auth) as Bearer. `role` comes
 * from a source the user cannot edit; it drives UI and early checks, and the backend still authorizes every call.
 */
export type Session = {
  userId: string
  accessToken: string
  role: SessionRole
  name: string | null
  email: string | null
}

export type Credentials = {
  email: string
  password: string
}

export type OAuthProvider = "google"

/** Server-side contract (Server Components, Server Actions, Route Handlers). */
export interface AuthProvider {
  /** Verified session, or null. Must not refresh tokens (the proxy does that). */
  getSession(): Promise<Session | null>
  /**
   * Like `getSession`, but also asks the Auth server whether the session is still valid (not revoked).
   * Use before sensitive actions.
   */
  verifySessionFresh(): Promise<Session | null>
  /** Throws on invalid credentials. Only callable from a Server Action / Route Handler. */
  signIn(credentials: Credentials): Promise<void>
  signOut(): Promise<void>
  /**
   * True when the Auth server rejected the input (wrong password, email taken, weak password, rate limit): safe
   * to show in the form. Anything else (network, 5xx) is an outage and must be rethrown.
   */
  isExpectedError(error: unknown): boolean
  /** Social / OIDC login (redirect flow). Only providers that support it implement this. */
  oauth?: {
    /** Returns the URL to send the browser to. */
    start(provider: OAuthProvider, redirectTo: string): Promise<string>
    /** Completes the flow on the callback route. Throws on failure. */
    exchangeCode(code: string, state?: string | null): Promise<void>
  }
}

export type ProxyAuthResult = {
  /** Response to return from `proxy.ts` (carries refreshed cookies). */
  response: NextResponse
  /** Optimistic: a session exists. Real authorization is done in the DAL. */
  isAuthenticated: boolean
  /** Role from the token, `null` when signed out. Optimistic, like `isAuthenticated`. */
  role: SessionRole | null
}
