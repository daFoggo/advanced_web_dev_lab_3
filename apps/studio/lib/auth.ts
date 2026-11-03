import "server-only"

import { getAuthProvider as getProvider } from "@workspace/auth/server"
import type { AuthProvider } from "@workspace/auth/types"

import { AUTH_OPTIONS } from "@/config/auth"

export type { Credentials, Session } from "@workspace/auth/types"

/** The auth provider (Neon Auth, docs/providers.md) bound to the studio cookie. */
export async function getAuthProvider(): Promise<AuthProvider> {
  return getProvider(AUTH_OPTIONS)
}
