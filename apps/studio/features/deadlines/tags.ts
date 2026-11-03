export const TAG_SUBJECTS = "subjects"
export const TAG_DEADLINES_LIST = "deadlines:list"
export const TAG_DEADLINE_IDS = "deadline-ids"

export function tagSubject(slug: string): string {
  return `subject:${slug}`
}

export function tagDeadline(id: number | string): string {
  return `deadline:${id}`
}
