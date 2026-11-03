import { sql } from "drizzle-orm"
import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

/** Class Deadline Hub data (Neon Postgres). Users live in Neon Auth (`neon_auth.user`), so `user_id` is plain text. */
export const subjects = pgTable("subjects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  lecturer: text("lecturer").notNull(),
  color: text("color").notNull(),
})

export const deadlines = pgTable(
  "deadlines",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    subjectId: integer("subject_id")
      .notNull()
      .references(() => subjects.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    createdBy: text("created_by").notNull(),
  },
  (t) => [
    index("deadlines_due_at_idx").on(t.dueAt),
    index("deadlines_subject_id_idx").on(t.subjectId),
  ]
)

export const completions = pgTable(
  "completions",
  {
    userId: text("user_id").notNull(),
    deadlineId: integer("deadline_id")
      .notNull()
      .references(() => deadlines.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [primaryKey({ columns: [t.userId, t.deadlineId] })]
)

export type Subject = typeof subjects.$inferSelect
export type NewSubject = typeof subjects.$inferInsert
export type Deadline = typeof deadlines.$inferSelect
export type NewDeadline = typeof deadlines.$inferInsert
export type Completion = typeof completions.$inferSelect
export type NewCompletion = typeof completions.$inferInsert
