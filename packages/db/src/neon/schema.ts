import { sql } from "drizzle-orm"
import { date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Application data (`DATA_PROVIDER=neon`). `ownerId` is the identity provider's user id as text, so
 * any identity provider works (Neon Auth, Keycloak). The tenant boundary is enforced in the queries.
 */
export const orgs = pgTable("orgs", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("Free"),
  members: integer("members").notNull().default(1),
  ownerId: text("owner_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const projects = pgTable("projects", {
  ref: text("ref").primaryKey(),
  name: text("name").notNull(),
  orgSlug: text("org_slug")
    .notNull()
    .references(() => orgs.slug, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  region: text("region").notNull(),
  createdAt: date("created_at", { mode: "string" })
    .notNull()
    .default(sql`current_date`),
})
