import "server-only"

import { and, asc, eq } from "drizzle-orm"

import { getDb } from "@workspace/db/neon"
import { completions, deadlines, subjects } from "@workspace/db/neon/schema"

import type { Deadline, Subject } from "./schemas"

export async function fetchSubjects(): Promise<Subject[]> {
  const db = getDb()
  const rows = await db.select().from(subjects).orderBy(asc(subjects.name))
  return rows
}

export async function fetchSubjectBySlug(
  slug: string
): Promise<Subject | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(subjects)
    .where(eq(subjects.slug, slug))
    .limit(1)
  return rows[0] ?? null
}

export async function fetchDeadlines(): Promise<Deadline[]> {
  const db = getDb()
  const rows = await db
    .select({
      id: deadlines.id,
      subjectId: deadlines.subjectId,
      title: deadlines.title,
      description: deadlines.description,
      dueAt: deadlines.dueAt,
      createdAt: deadlines.createdAt,
      createdBy: deadlines.createdBy,
      subject: subjects,
    })
    .from(deadlines)
    .innerJoin(subjects, eq(deadlines.subjectId, subjects.id))
    .orderBy(asc(deadlines.dueAt))

  return rows.map((r) => ({
    ...r,
    dueAt: r.dueAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function fetchDeadlineById(id: number): Promise<Deadline | null> {
  const db = getDb()
  const rows = await db
    .select({
      id: deadlines.id,
      subjectId: deadlines.subjectId,
      title: deadlines.title,
      description: deadlines.description,
      dueAt: deadlines.dueAt,
      createdAt: deadlines.createdAt,
      createdBy: deadlines.createdBy,
      subject: subjects,
    })
    .from(deadlines)
    .innerJoin(subjects, eq(deadlines.subjectId, subjects.id))
    .where(eq(deadlines.id, id))
    .limit(1)

  if (!rows[0]) return null
  return {
    ...rows[0],
    dueAt: rows[0].dueAt.toISOString(),
    createdAt: rows[0].createdAt.toISOString(),
  }
}

export async function fetchDeadlineIds(): Promise<{ id: number }[]> {
  const db = getDb()
  return db.select({ id: deadlines.id }).from(deadlines)
}

export async function fetchDeadlinesBySubjectSlug(
  slug: string
): Promise<Deadline[]> {
  const db = getDb()
  const rows = await db
    .select({
      id: deadlines.id,
      subjectId: deadlines.subjectId,
      title: deadlines.title,
      description: deadlines.description,
      dueAt: deadlines.dueAt,
      createdAt: deadlines.createdAt,
      createdBy: deadlines.createdBy,
      subject: subjects,
    })
    .from(deadlines)
    .innerJoin(subjects, eq(deadlines.subjectId, subjects.id))
    .where(eq(subjects.slug, slug))
    .orderBy(asc(deadlines.dueAt))

  return rows.map((r) => ({
    ...r,
    dueAt: r.dueAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function fetchMyCompletions(userId: string): Promise<number[]> {
  const db = getDb()
  const rows = await db
    .select({ deadlineId: completions.deadlineId })
    .from(completions)
    .where(eq(completions.userId, userId))

  return rows.map((r) => r.deadlineId)
}

export async function fetchMyDeadlinesWithStatus(
  userId: string
): Promise<Deadline[]> {
  const [allDeadlines, userCompletions] = await Promise.all([
    fetchDeadlines(),
    fetchMyCompletions(userId),
  ])

  const completedSet = new Set(userCompletions)
  return allDeadlines.map((d) => ({
    ...d,
    completed: completedSet.has(d.id),
  }))
}

export async function toggleCompletion(
  userId: string,
  deadlineId: number
): Promise<{ completed: boolean }> {
  const db = getDb()

  // Verify deadline exists first (R1-m4)
  const existingDeadline = await db
    .select({ id: deadlines.id })
    .from(deadlines)
    .where(eq(deadlines.id, deadlineId))
    .limit(1)

  if (!existingDeadline[0]) {
    throw new Error("Deadline không tồn tại")
  }

  // Check if completion exists
  const existing = await db
    .select()
    .from(completions)
    .where(
      and(
        eq(completions.userId, userId),
        eq(completions.deadlineId, deadlineId)
      )
    )
    .limit(1)

  if (existing.length > 0) {
    await db
      .delete(completions)
      .where(
        and(
          eq(completions.userId, userId),
          eq(completions.deadlineId, deadlineId)
        )
      )
    return { completed: false }
  }

  await db
    .insert(completions)
    .values({ userId, deadlineId })
    .onConflictDoNothing()
  return { completed: true }
}

export async function insertDeadline(
  input: {
    subjectId: number
    title: string
    dueAt: Date
    description: string | null
  },
  userId: string
): Promise<Deadline> {
  const db = getDb()
  const inserted = await db
    .insert(deadlines)
    .values({
      subjectId: input.subjectId,
      title: input.title,
      dueAt: input.dueAt,
      description: input.description,
      createdBy: userId,
    })
    .returning()

  const first = inserted[0]
  if (!first) {
    throw new Error("Không thể tạo deadline")
  }

  const deadline = await fetchDeadlineById(first.id)
  if (!deadline) {
    throw new Error("Không thể tải deadline vừa tạo")
  }
  return deadline
}

export async function deleteDeadline(
  id: number
): Promise<{ id: number; subjectSlug: string } | null> {
  const db = getDb()
  const existing = await fetchDeadlineById(id)
  if (!existing) return null

  await db.delete(deadlines).where(eq(deadlines.id, id))
  return {
    id,
    subjectSlug: existing.subject?.slug ?? "",
  }
}
