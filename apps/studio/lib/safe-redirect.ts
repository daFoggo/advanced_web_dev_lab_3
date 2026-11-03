import { DASHBOARD_PATH } from "@/config/routes"

const BASE = "http://localhost"
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/

/** Percent-decodes up to a few times so `%2F%2F` and `%252F%252F` are judged as what a browser may end up with. */
function decodeFully(value: string): string | null {
  let current = value
  for (let i = 0; i < 3; i++) {
    let next: string
    try {
      next = decodeURIComponent(current)
    } catch {
      return null
    }
    if (next === current) return current
    current = next
  }
  return current
}

/**
 * Only same-origin internal paths survive; everything else (absolute URLs, `//host`, `/\host`, `javascript:`,
 * control characters, encoded variants) becomes `fallback`. Use for any `callbackUrl` before redirecting.
 */
export function safeCallbackUrl(
  value: unknown,
  fallback: string = DASHBOARD_PATH
): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback
  if (CONTROL_CHARS.test(value) || value.includes("\\")) return fallback
  const decoded = decodeFully(value)
  if (
    decoded === null ||
    CONTROL_CHARS.test(decoded) ||
    decoded.includes("\\") ||
    decoded.startsWith("//")
  ) {
    return fallback
  }
  try {
    const url = new URL(value, BASE)
    if (url.origin !== BASE) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
