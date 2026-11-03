import { authConfig } from "../config"

type Ctx = { params: Promise<{ path: string[] }> }
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

const notFound = () => new Response(null, { status: 404 })

/**
 * Route handlers for `app/api/auth/[...path]/route.ts`. Only `neon-auth` serves it (a proxy to Neon's hosted
 * server); the other stacks answer 404.
 */
export function createAuthHandler() {
  const methods: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE"]
  return Object.fromEntries(
    methods.map((method) => [
      method,
      authConfig.AUTH_PROVIDER === "neon-auth"
        ? async (request: Request, ctx: Ctx) => {
            // Lazy: the Neon SDK is only loaded on its own stack.
            const { getNeonAuth } = await import("./auth")
            return getNeonAuth().handler()[method](request, ctx)
          }
        : notFound,
    ])
  ) as Record<Method, (request: Request, ctx: Ctx) => Promise<Response>>
}
