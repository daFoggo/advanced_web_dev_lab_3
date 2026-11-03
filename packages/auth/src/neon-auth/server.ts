import "server-only"

import { io } from "next/cache"

import { parseRole } from "../permissions"
import type {
  AuthProvider,
  Credentials,
  Session,
} from "../types"
import { getNeonAuth } from "./auth"

/** A rejection from Neon Auth (`{ error }` result), kept apart from outages (thrown by the SDK). */
export class NeonAuthRejection extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "NeonAuthRejection"
  }
}

type Rejected = { message?: string; status?: number } | null | undefined

function check(error: Rejected) {
  if (error) {
    throw new NeonAuthRejection(
      error.message ?? "Request rejected",
      error.status ?? 400
    )
  }
}

export function createNeonAuthProvider(): AuthProvider {
  const auth = getNeonAuth()

  async function read(): Promise<Session | null> {
    // The SDK checks expiry against Date.now(), which must not run during prerender.
    await io()
    const { data } = await auth.getSession()
    if (!data?.user) return null
    // `token` exists at runtime (docs) but is missing from the SDK's server typings.
    const token = await (
      auth as unknown as {
        token(): Promise<{ data?: { token?: string } | null }>
      }
    ).token()
    return {
      userId: data.user.id,
      accessToken: token.data?.token ?? "",
      role: parseRole((data.user as { role?: string }).role),
      name: data.user.name ?? null,
      email: data.user.email ?? null,
    }
  }

  return {
    getSession: read,
    // The SDK validates the session with Neon Auth when its signed cache cookie has expired (5 min).
    verifySessionFresh: read,

    async signIn(credentials: Credentials): Promise<void> {
      const { error } = await auth.signIn.email({
        email: credentials.email,
        password: credentials.password,
      })
      check(error)
    },

    async signOut(): Promise<void> {
      await auth.signOut()
    },

    isExpectedError(error: unknown): boolean {
      return (
        error instanceof NeonAuthRejection &&
        error.status >= 400 &&
        error.status < 500
      )
    },

    oauth: {
      async start(provider, redirectTo) {
        if (provider !== "google") {
          throw new Error(`Provider not supported on neon-auth: ${provider}`)
        }
        const { data, error } = await auth.signIn.social({
          provider: "google",
          callbackURL: redirectTo,
        })
        check(error)
        if (!data?.url) throw new Error("Social sign in returned no URL")
        return data.url
      },
      async exchangeCode(): Promise<void> {
        // Neon Auth completes the flow on `/api/auth/*`.
      },
    },
  }
}
