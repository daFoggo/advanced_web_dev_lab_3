type Ctx = { params: Promise<{ path: string[] }> }
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

/** The first path segment, decoded and normalized, so `Sign-Up` and `%73ign-up` are the same segment as `sign-up`. */
function firstSegment(path: string[] | undefined): string {
  const segment = path?.[0] ?? ""
  try {
    return decodeURIComponent(segment).trim().toLowerCase()
  } catch {
    return segment.trim().toLowerCase()
  }
}

/**
 * Route handlers for `app/api/auth/[...path]/route.ts`. A proxy to Neon's hosted server.
 * Public sign-up is closed (the class has two seeded accounts): `sign-up/*` answers 403 here. This guards this
 * app's endpoint only; Neon's own hosted API stays open unless disabled in the Neon Console.
 */
export function createAuthHandler() {
  const methods: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE"]
  return Object.fromEntries(
    methods.map((method) => [
      method,
      async (request: Request, ctx: Ctx) => {
        const { path } = await ctx.params
        if (firstSegment(path) === "sign-up") {
          return Response.json(
            { message: "Đăng ký tài khoản đã bị tắt." },
            { status: 403 }
          )
        }
        const { getNeonAuth } = await import("./auth")
        return getNeonAuth().handler()[method](request, ctx)
      },
    ])
  ) as Record<Method, (request: Request, ctx: Ctx) => Promise<Response>>
}
