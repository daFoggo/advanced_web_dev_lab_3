import type { Deadline } from "./schemas"

export type DeadlineFilter = {
  subject?: string
  status?: "all" | "upcoming" | "overdue"
  sort?: "due-asc" | "due-desc"
}

export function parseFilters(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): DeadlineFilter {
  const get = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? undefined
    }
    const val = searchParams[key]
    return Array.isArray(val) ? val[0] : val
  }

  const subject = get("subject") || "all"
  const rawStatus = get("status")
  const status: "all" | "upcoming" | "overdue" =
    rawStatus === "upcoming" || rawStatus === "overdue" ? rawStatus : "all"
  const rawSort = get("sort")
  const sort: "due-asc" | "due-desc" =
    rawSort === "due-desc" ? "due-desc" : "due-asc"

  return { subject, status, sort }
}

export function applyFilters(
  deadlines: Deadline[],
  filters: DeadlineFilter,
  now: Date = new Date()
): Deadline[] {
  let result = [...deadlines]

  if (filters.subject && filters.subject !== "all") {
    result = result.filter((d) => d.subject?.slug === filters.subject)
  }

  if (filters.status === "upcoming") {
    result = result.filter((d) => new Date(d.dueAt).getTime() >= now.getTime())
  } else if (filters.status === "overdue") {
    result = result.filter((d) => new Date(d.dueAt).getTime() < now.getTime())
  }

  result.sort((a, b) => {
    const timeA = new Date(a.dueAt).getTime()
    const timeB = new Date(b.dueAt).getTime()
    return filters.sort === "due-desc" ? timeB - timeA : timeA - timeB
  })

  return result
}
