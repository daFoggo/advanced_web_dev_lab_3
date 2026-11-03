import "server-only"

import type { AuthOptions, AuthProvider } from "./types"

/** The auth provider (Neon Auth). `options` is kept for the per-app cookie seam used by the callers. */
export async function getAuthProvider(
  _options: AuthOptions
): Promise<AuthProvider> {
  return (await import("./neon-auth/server")).createNeonAuthProvider()
}
