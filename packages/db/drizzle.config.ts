import { defineConfig } from "drizzle-kit"

// Migrations need a direct (non-pooled) connection: PgBouncer does not keep session state.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/neon/schema.ts",
  out: "./neon/migrations",
  schemaFilter: ["public"],
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
})
