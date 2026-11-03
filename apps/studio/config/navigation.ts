import type { Action } from "@workspace/auth/permissions"

import { ADMIN_PATH, DASHBOARD_PATH, MY_DEADLINES_PATH } from "@/config/routes"

/**
 * Semantic icon names, resolved to Tabler icons in `components/layout/sidebar/nav-icons.tsx`. Names
 * (not components) because `entries` cross from a Server Component to the client `NavTree`.
 */
export type NavIconName = "overview" | "deadlines" | "admin"

export type NavLink = {
  title: string
  /** May hold `:param` placeholders (see `NavScope.param`), filled from the URL. */
  href: string
  icon: NavIconName
  /** Action the role needs to see the link (`can(role, action)`). */
  action: Action
  /** Short mono text on the right, e.g. "due". Set at render time, not in the config. */
  badge?: string
  /**
   * Per-link prefetching (`<Link prefetch>`) for pages that read `searchParams`: URL data is not
   * in the shared App Shell, so without it their data waits for the click. Costs one server call per link.
   */
  prefetch?: true
}
/** A collapsible group inside a section; the tree stays at most two levels deep. */
export type NavGroup = { title: string; items: NavLink[] }
export type NavEntry = NavLink | NavGroup
/** One labelled block of the sidebar. Add sections freely; empty ones are hidden. */
export type NavSection = { label: string; entries: NavEntry[] }

/**
 * One sidebar menu, chosen by the URL. A scope with a `prefix` owns every path under
 * `<prefix>/<param value>`; the scope without one is the fallback. Plain data, so a Server
 * Component can filter it and hand it to the client.
 */
export type NavScope = {
  id: string
  prefix?: string
  /** Name of the URL segment after `prefix`, used as `:param` in hrefs. */
  param?: string
  sections: NavSection[]
}

/** `action` only hides links; each page still calls `requireCan`. */
export const NAV_SCOPES: NavScope[] = [
  {
    id: "global",
    sections: [
      {
        label: "Lớp học",
        entries: [
          {
            title: "Tổng quan",
            href: DASHBOARD_PATH,
            icon: "overview",
            action: "deadline:view",
          },
          {
            title: "Deadline của tôi",
            href: MY_DEADLINES_PATH,
            icon: "deadlines",
            action: "deadline:view",
          },
          {
            title: "Quản trị",
            href: ADMIN_PATH,
            icon: "admin",
            action: "deadline:create",
          },
        ],
      },
    ],
  },
]

export type ResolvedScope = {
  scope: NavScope
  /** URL values by `param` name. */
  params: Record<string, string>
}

/** The scope a pathname belongs to (the fallback when no prefix matches) and its URL params. */
export function resolveScope(
  scopes: NavScope[],
  pathname: string
): ResolvedScope | undefined {
  for (const scope of scopes) {
    if (!scope.prefix || !scope.param) continue
    if (!pathname.startsWith(`${scope.prefix}/`)) continue
    const value = pathname.slice(scope.prefix.length + 1).split("/")[0]
    if (value) {
      return { scope, params: { [scope.param]: decodeURIComponent(value) } }
    }
  }
  const fallback = scopes.find((scope) => !scope.prefix)
  return fallback && { scope: fallback, params: {} }
}

/** Fills `:param` placeholders in an href. */
export function fillHref(href: string, params: Record<string, string>) {
  return href.replace(/:(\w+)/g, (match, name: string) =>
    name in params ? encodeURIComponent(params[name]!) : match
  )
}

/** Sections of the pathname's scope with real hrefs. */
export function sectionsFor(
  scopes: NavScope[],
  pathname: string
): NavSection[] {
  const resolved = resolveScope(scopes, pathname)
  if (!resolved) return []
  const { scope, params } = resolved
  const fill = (link: NavLink): NavLink => ({
    ...link,
    href: fillHref(link.href, params),
  })
  return scope.sections.map((section) => ({
    ...section,
    entries: section.entries.map((entry) =>
      "items" in entry
        ? { ...entry, items: entry.items.map(fill) }
        : fill(entry)
    ),
  }))
}

/**
 * Keeps the links `can` allows and drops groups or sections left empty. Takes a predicate
 * (`(action) => can(role, action)`) so this module stays free of auth code and is safe to
 * import from client components.
 */
export function filterNav(
  scopes: NavScope[],
  can: (action: Action) => boolean
): NavScope[] {
  return scopes.map((scope) => ({
    ...scope,
    sections: scope.sections.flatMap((section) => {
      const entries = section.entries.flatMap<NavEntry>((entry) => {
        if (!("items" in entry)) return can(entry.action) ? [entry] : []
        const items = entry.items.filter((item) => can(item.action))
        return items.length ? [{ ...entry, items }] : []
      })
      return entries.length ? [{ ...section, entries }] : []
    }),
  }))
}
