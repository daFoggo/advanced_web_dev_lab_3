// Idempotent seed for Class Deadline Hub (Neon Postgres + Neon Auth).
//   pnpm --filter @workspace/db neon:seed             upsert subjects, deadlines 1..12 and the two accounts
//   pnpm --filter @workspace/db neon:seed -- --reset  also delete deadlines with id > 12 and every completion
import pg from "pg"

import { ACCOUNTS, buildDeadlines, SUBJECTS } from "./seed-data.mjs"

const ORIGIN = "http://localhost:3001"
const FIXED_IDS = 12

function need(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required (apps/studio/.env.local)`)
  return value
}

function withVerifyFull(connectionString) {
  const url = new URL(connectionString)
  if (
    ["require", "prefer", "verify-ca"].includes(url.searchParams.get("sslmode"))
  ) {
    url.searchParams.set("sslmode", "verify-full")
  }
  return url.toString()
}

async function seedData(client, reset) {
  await client.query("begin")
  try {
    if (reset) {
      const d = await client.query("delete from deadlines where id > $1", [
        FIXED_IDS,
      ])
      const c = await client.query("delete from completions")
      console.log(
        `reset: removed ${d.rowCount} deadlines (id > ${FIXED_IDS}) and ${c.rowCount} completions`
      )
    }
    const subjectIds = new Map()
    for (const s of SUBJECTS) {
      const { rows } = await client.query(
        `insert into subjects (slug, name, code, lecturer, color) values ($1,$2,$3,$4,$5)
         on conflict (slug) do update set name = excluded.name, code = excluded.code,
           lecturer = excluded.lecturer, color = excluded.color
         returning id`,
        [s.slug, s.name, s.code, s.lecturer, s.color]
      )
      subjectIds.set(s.slug, rows[0].id)
    }
    for (const d of buildDeadlines(new Date())) {
      await client.query(
        `insert into deadlines (id, subject_id, title, description, due_at, created_by)
         overriding system value values ($1,$2,$3,$4,$5,$6)
         on conflict (id) do update set subject_id = excluded.subject_id, title = excluded.title,
           description = excluded.description, due_at = excluded.due_at, created_by = excluded.created_by`,
        [d.id, subjectIds.get(d.subject), d.title, d.description, d.dueAt, d.createdBy]
      )
    }
    await client.query(
      "select setval(pg_get_serial_sequence('deadlines','id'), (select max(id) from deadlines))"
    )
    await client.query("commit")
  } catch (error) {
    await client.query("rollback")
    throw error
  }
}

async function authPost(path, body) {
  const res = await fetch(`${need("NEON_AUTH_BASE_URL")}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    // not JSON
  }
  return { ok: res.ok, status: res.status, json, text }
}

async function findUser(client, email) {
  const { rows } = await client.query(
    'select id, role from neon_auth."user" where email = $1',
    [email]
  )
  return rows[0] ?? null
}

async function signIn(account) {
  const res = await authPost("/sign-in/email", {
    email: account.email,
    password: account.password,
  })
  return res.ok
    ? { ok: true, role: res.json?.user?.role ?? null }
    : { ok: false, status: res.status, text: res.text.slice(0, 200) }
}

async function neonApi(method, path, body) {
  const res = await fetch(`https://console.neon.tech/api/v2${path}`, {
    method,
    headers: {
      authorization: `Bearer ${need("NEON_API_KEY")}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Neon API ${method} ${path} -> ${res.status} ${text.slice(0, 200)}`)
  }
  return JSON.parse(text)
}

async function setAdminRole(client, userId) {
  try {
    const projectId = need("NEON_PROJECT_ID")
    const { branches } = await neonApi("GET", `/projects/${projectId}/branches`)
    const branch = branches.find((b) => b.name === "production")
    if (!branch) throw new Error("no branch named production")
    await neonApi(
      "PUT",
      `/projects/${projectId}/branches/${branch.id}/auth/users/${userId}/role`,
      { roles: ["admin"] }
    )
    console.log("admin role set via Neon API")
  } catch (error) {
    console.warn(
      `Neon API role update failed (${error.message}); FALLBACK: direct SQL update for admin@ptit.edu.vn only`
    )
    await client.query(
      `update neon_auth."user" set role = 'admin' where email = 'admin@ptit.edu.vn'`
    )
  }
}

async function seedAccounts(client) {
  for (const account of ACCOUNTS) {
    let user = await findUser(client, account.email)
    if (user) {
      console.log(`account ${account.email}: exists, skipped sign-up`)
    } else {
      const res = await authPost("/sign-up/email", {
        email: account.email,
        password: account.password,
        name: account.name,
      })
      if (!res.ok) {
        throw new Error(`sign-up ${account.email} failed: ${res.status} ${res.text.slice(0, 200)}`)
      }
      user = await findUser(client, account.email)
      if (!user) throw new Error(`sign-up ${account.email} ok but user not found`)
      console.log(`account ${account.email}: created`)
    }
    if (account.role === "admin" && user.role !== "admin") {
      await setAdminRole(client, user.id)
    }
    const check = await signIn(account)
    console.log(
      check.ok
        ? `account ${account.email}: sign-in ok, role=${check.role}`
        : `account ${account.email}: sign-in FAILED ${check.status} ${check.text}`
    )
    if (check.ok && check.role !== account.role) {
      console.warn(`  expected role ${account.role}`)
    }
  }
}

const reset = process.argv.includes("--reset")
const client = new pg.Client({
  connectionString: withVerifyFull(
    process.env.DATABASE_URL_UNPOOLED ?? need("DATABASE_URL")
  ),
})
await client.connect()
try {
  await seedData(client, reset)
  const counts = await client.query(
    `select (select count(*) from subjects)::int as subjects,
            (select count(*) from deadlines)::int as deadlines,
            (select count(*) from completions)::int as completions`
  )
  console.log("rows:", JSON.stringify(counts.rows[0]))
  await seedAccounts(client)
} finally {
  await client.end()
}
