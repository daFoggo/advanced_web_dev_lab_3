export type CountdownResult = {
  kind: "overdue" | "hours" | "days"
  n: number
  text: string
}

/**
 * Calculates countdown according to requirements:
 * - Overdue: "Quá hạn Y ngày" (rounded up)
 * - Due within 24 hours: "Còn X giờ" (rounded up)
 * - Due in more than 24 hours: "Còn X ngày" (rounded up)
 */
export function describeCountdown(
  dueAt: Date | string,
  now: Date | string = new Date()
): CountdownResult {
  const dueDate = typeof dueAt === "string" ? new Date(dueAt) : dueAt
  const nowDate = typeof now === "string" ? new Date(now) : now

  const diffMs = dueDate.getTime() - nowDate.getTime()

  if (diffMs < 0) {
    const overdueMs = Math.abs(diffMs)
    const days = Math.ceil(overdueMs / (24 * 60 * 60 * 1000))
    return {
      kind: "overdue",
      n: days,
      text: `Quá hạn ${days} ngày`,
    }
  }

  const hours = Math.ceil(diffMs / (60 * 60 * 1000))
  if (hours <= 24) {
    return {
      kind: "hours",
      n: hours,
      text: `Còn ${hours} giờ`,
    }
  }

  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000))
  return {
    kind: "days",
    n: days,
    text: `Còn ${days} ngày`,
  }
}
