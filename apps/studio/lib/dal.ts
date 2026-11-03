import "server-only"

import { cache } from "react"
import { cacheLife, cacheTag } from "next/cache"
import { forbidden, redirect } from "next/navigation"

import { can, roleOf, type Action } from "@workspace/auth/permissions"

import { SESSION_EXPIRED_PATH } from "@/config/routes"

import { getAuthProvider, type Session } from "./auth"

export type { Session }

/**
 * Data Access Layer entry point. `"use cache: private"` (not React `cache`, which each cache scope
 * isolates) so every query's private scope joins one session read per request, and the read
 * (cookies + the SDK's `Date.now()` expiry check) can run in the per-session App Shell.
 * Never stored on the server across production requests.
 */
export const SESSION_TAG = "session"

export async function getSession(): Promise<Session | null> {
  "use cache: private"
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 })
  cacheTag(SESSION_TAG)
  const provider = await getAuthProvider()
  return provider.getSession()
}

/** Call close to the data (queries, actions), not in layouts. */
export const verifySession = cache(async (): Promise<Session> => {
  const session = await getSession()
  if (!session) redirect(SESSION_EXPIRED_PATH)
  return session
})

/**
 * Session whose role can do `action` (`can(roleOf(session), action)`), else the nearest
 * forbidden.tsx (403). Call in the page or action that needs it, not in a layout.
 */
export const requireCan = cache(async (action: Action): Promise<Session> => {
  const session = await verifySession()
  if (!can(roleOf(session), action)) forbidden()
  return session
})

/**
 * For sensitive actions (create/delete): also confirms with the identity system that the session
 * was not revoked. Costs a network round trip.
 */
export const verifySessionFresh = cache(async (): Promise<Session> => {
  const provider = await getAuthProvider()
  const session = await provider.verifySessionFresh()
  if (!session) redirect(SESSION_EXPIRED_PATH)
  return session
})
