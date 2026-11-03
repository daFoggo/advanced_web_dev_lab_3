import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import type { Deadline, Subject } from "./schemas"
import {
  fetchDeadlineById,
  fetchDeadlineIds,
  fetchDeadlines,
  fetchDeadlinesBySubjectSlug,
  fetchSubjectBySlug,
  fetchSubjects,
} from "./server"
import {
  TAG_DEADLINE_IDS,
  TAG_DEADLINES_LIST,
  TAG_SUBJECTS,
  tagDeadline,
  tagSubject,
} from "./tags"

export async function getSubjects(): Promise<Subject[]> {
  "use cache"
  cacheLife("max")
  cacheTag(TAG_SUBJECTS)
  return fetchSubjects()
}

export async function getSubjectPage(slug: string): Promise<{
  subject: Subject | null
  deadlines: Deadline[]
}> {
  "use cache"
  cacheLife("max")
  cacheTag(tagSubject(slug))

  const subject = await fetchSubjectBySlug(slug)
  if (!subject) return { subject: null, deadlines: [] }

  const subjectDeadlines = await fetchDeadlinesBySubjectSlug(slug)
  return { subject, deadlines: subjectDeadlines }
}

export async function getDeadlineList(): Promise<{
  items: Deadline[]
  generatedAt: string
}> {
  "use cache"
  cacheLife("minutes")
  cacheTag(TAG_DEADLINES_LIST)

  const items = await fetchDeadlines()
  return {
    items,
    generatedAt: new Date().toISOString(),
  }
}

export async function getDeadline(id: number): Promise<Deadline | null> {
  "use cache"
  cacheLife("max")
  cacheTag(tagDeadline(id))

  return fetchDeadlineById(id)
}

export async function getDeadlineIds(): Promise<{ id: number }[]> {
  "use cache"
  cacheLife("max")
  cacheTag(TAG_DEADLINE_IDS)

  return fetchDeadlineIds()
}
