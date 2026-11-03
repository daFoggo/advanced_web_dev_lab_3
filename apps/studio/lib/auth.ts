import "server-only"

import { cookies } from "next/headers"

import { authConfig } from "@workspace/auth/config"
import { getAuthProvider as getProvider } from "@workspace/auth/server"
import type { AuthProvider, Session } from "@workspace/auth/types"

import { AUTH_OPTIONS } from "@/config/auth"
import { DEMO_COOKIE, readDemoSession } from "@/lib/demo-session"

export type {
  Calendar,
  Credentials,
  Session,
  SignUpInput,
  SignUpResult,
} from "@workspace/auth/types"

/** Active provider union for this deployment. */
export function getActiveAuthProvider():
  "neon-auth" | "supabase" | "keycloak" | "fastapi-oauth" {
  return authConfig.AUTH_PROVIDER
}

/**
 * Google sign-in is offered when the stack can do it: Neon Auth (the provider is switched on in the Neon console;
 * a click on an unconfigured one lands on `?error=oauth`).
 */
export function isGoogleEnabled(): boolean {
  return authConfig.AUTH_PROVIDER === "neon-auth"
}

/** True when the active deployment runs on the Keycloak IDP stack. */
export function isKeycloakProvider(): boolean {
  return authConfig.AUTH_PROVIDER === "keycloak"
}

/** The active provider (`AUTH_PROVIDER`, docs/providers.md) bound to the studio cookie. */
export async function getAuthProvider(): Promise<AuthProvider> {
  const cookieStore = await cookies()
  const demo = await readDemoSession(cookieStore.get(DEMO_COOKIE)?.value)
  if (!demo) return getProvider(AUTH_OPTIONS)

  const session: Session = {
    userId: demo.sub,
    accessToken: "",
    role: "customer",
    name: "Demo user",
    email: "demo@next-mono-base.local",
  }
  return {
    getSession: async () => session,
    verifySessionFresh: async () => session,
    signIn: async () => {
      throw new Error("Demo session cannot sign in.")
    },
    signUp: async () => {
      throw new Error("Demo session cannot sign up.")
    },
    signOut: async () => {
      cookieStore.delete(DEMO_COOKIE)
    },
    isExpectedError: () => false,
  }
}
