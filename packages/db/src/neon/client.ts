import "server-only"

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import pg from "pg"

import * as schema from "./schema"

export type NeonDb = NodePgDatabase<typeof schema>

/**
 * `pg` already treats `sslmode=require|prefer|verify-ca` as `verify-full` and warns on every start (it changes in pg 9).
 * Say it explicitly so behaviour stays the same and the warning goes away; Neon serves a publicly trusted certificate.
 */
export function withVerifyFull(connectionString: string): string {
  const url = new URL(connectionString)
  const mode = url.searchParams.get("sslmode")
  if (mode === "require" || mode === "prefer" || mode === "verify-ca") {
    url.searchParams.set("sslmode", "verify-full")
  }
  return url.toString()
}

// On globalThis so dev hot reloads reuse one pool instead of opening one per reload.
const globalForDb = globalThis as { __neonDb?: NeonDb }

/**
 * Drizzle over `node-postgres` (Vercel Fluid compute and Node runtimes reuse the pool across requests).
 * Pass the pooled `DATABASE_URL` here; migrations use the direct URL (`drizzle.config.ts`).
 * Created on first use so importing this module needs no database.
 */
export function getDb(): NeonDb {
  if (!globalForDb.__neonDb) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error("DATABASE_URL is required when DATA_PROVIDER=neon")
    }
    globalForDb.__neonDb = drizzle(
      new pg.Pool({
        connectionString: withVerifyFull(connectionString),
        max: 10,
        idleTimeoutMillis: 30_000,
      }),
      { schema }
    )
  }
  return globalForDb.__neonDb
}
