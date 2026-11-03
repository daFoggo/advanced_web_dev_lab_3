/** Path prefixes that require a session (optimistic check in `proxy.ts`). */
export const PROTECTED_PREFIXES = ["/dashboard", "/admin"] as const
/** Prefix only admins may open (the `/admin` page itself re-checks with `requireCan`). */
export const ADMIN_PREFIX = "/admin"

export const HOME_PATH = "/"
export const LOGIN_PATH = "/login"
export const FORBIDDEN_PATH = "/403"
/** Pages a signed-in user is redirected away from (optimistic check in `proxy.ts`). */
export const AUTH_PAGES = [LOGIN_PATH] as const
export const DASHBOARD_PATH = "/dashboard"
export const MY_DEADLINES_PATH = "/dashboard/deadlines"
export const ADMIN_PATH = "/admin"
export const DEADLINES_PATH = "/deadlines"
export const OAUTH_CALLBACK_PATH = "/auth/callback"
/**
 * Clears the session cookie, then goes to login. Used when the backend rejects a token
 * and when the DAL finds no usable session, which also breaks any proxy/DAL redirect loop.
 */
export const SESSION_EXPIRED_PATH = "/auth/expired"
