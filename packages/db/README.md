# @workspace/db

Neon Postgres access (Drizzle ORM + `pg`) for `apps/studio`: schema, migrations and the seed.

| Script (`pnpm --filter @workspace/db …`) | What it does |
| :--- | :--- |
| `neon:generate` | Generates a migration from `src/neon/schema.ts` into `neon/migrations` (interactive when a table is both added and dropped) |
| `neon:migrate` | Applies migrations through `DATABASE_URL_UNPOOLED` (env from `apps/studio/.env.local`) |
| `neon:seed` | Idempotent seed: 4 subjects, deadlines with fixed ids 1..12 (due dates relative to now) and the accounts `admin@ptit.edu.vn` (admin) and `sv@ptit.edu.vn` (user) |
| `neon:seed -- --reset` | Same, plus deletes deadlines with id > 12 and every completion |

Tables (`public`): `subjects`, `deadlines`, `completions`. Users live in Neon Auth (`neon_auth.user`), so
`completions.user_id` is that user's id as text, with no cross-schema foreign key.
Admin role is set through the Neon API (`PUT …/auth/users/{id}/role`) using `NEON_API_KEY` and `NEON_PROJECT_ID`.
Exports: `@workspace/db/neon` (`getDb()`) and `@workspace/db/neon/schema`.
