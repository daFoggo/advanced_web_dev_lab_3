"use client"

import { createAuthClient } from "@neon/auth/next"

/**
 * Browser auth client for client islands (reads `useSession()`). It talks to this app's `/api/auth/*`
 * proxy, so no secret is involved. Created lazily and once.
 */
type AuthClient = ReturnType<typeof createAuthClient>
let client: AuthClient | undefined

export function getAuthClient(): AuthClient {
  return (client ??= createAuthClient())
}
