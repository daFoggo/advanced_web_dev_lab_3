import { randomUUID } from "node:crypto"

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

/**
 * Live test of `server.neon.ts` against a Neon branch. Skipped unless `NEON_TEST_DATABASE_URL` points at a
 * disposable branch (never production): `neon branches create --name ci-test`, migrate it, export the URL.
 */
const url = process.env.NEON_TEST_DATABASE_URL

describe.skipIf(!url)("neon backend (live)", () => {
  const run = randomUUID().slice(0, 8)
  const userA = randomUUID()
  const userB = randomUUID()
  const orgName = `Neon Test ${run}`
  const orgSlug = `neon-test-${run}`
  let server: typeof import("../server.neon")
  let db: ReturnType<typeof import("@workspace/db/neon").getDb>

  beforeAll(async () => {
    process.env.DATABASE_URL = url
    server = await import("../server.neon")
    db = (await import("@workspace/db/neon")).getDb()
  })

  afterAll(async () => {
    const { orgs } = await import("@workspace/db/neon/schema")
    const { inArray } = await import("drizzle-orm")
    // Projects go with their org (ON DELETE CASCADE).
    await db.delete(orgs).where(inArray(orgs.ownerId, [userA, userB]))
  })

  it("starts empty for a new user", async () => {
    expect(await server.fetchOrgs(userA)).toEqual([])
    expect(await server.fetchProjects(userA)).toEqual([])
  })

  it("creates an organization owned by the caller", async () => {
    const org = await server.insertOrg(userA, { name: orgName })
    expect(org).toMatchObject({
      slug: orgSlug,
      name: orgName,
      plan: "Free",
      members: 1,
    })
    expect((await server.fetchOrgs(userA)).map((o) => o.slug)).toEqual([
      orgSlug,
    ])
  })

  it("rejects a duplicate slug with an expected 409, even from another user", async () => {
    await expect(
      server.insertOrg(userA, { name: orgName })
    ).rejects.toMatchObject({ status: 409 })
    await expect(
      server.insertOrg(userB, { name: orgName })
    ).rejects.toMatchObject({ status: 409 })
  })

  it("rejects names with no usable letters (422)", async () => {
    await expect(
      server.insertOrg(userA, { name: "!!!" })
    ).rejects.toMatchObject({ status: 422 })
  })

  it("creates projects, lists them, and rejects a duplicate ref (409)", async () => {
    const project = await server.insertProject(userA, orgSlug, {
      name: `Web ${run}`,
      region: "eu-west-1",
    })
    expect(project).toMatchObject({
      ref: `web-${run}`,
      orgSlug,
      status: "active",
      region: "eu-west-1",
    })
    expect(project.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect((await server.fetchProjects(userA)).map((p) => p.ref)).toEqual([
      `web-${run}`,
    ])
    await expect(
      server.insertProject(userA, orgSlug, {
        name: `Web ${run}`,
        region: "us-east-1",
      })
    ).rejects.toMatchObject({ status: 409 })
  })

  it("is invisible and read-only to another user (tenant isolation)", async () => {
    expect(await server.fetchOrgs(userB)).toEqual([])
    expect(await server.fetchProjects(userB)).toEqual([])
    await expect(
      server.insertProject(userB, orgSlug, {
        name: `Hijack ${run}`,
        region: "us-east-1",
      })
    ).rejects.toMatchObject({ status: 403 })
  })

  it("answers 404 for an organization that does not exist", async () => {
    await expect(
      server.insertProject(userA, `ghost-${run}`, {
        name: `Nope ${run}`,
        region: "us-east-1",
      })
    ).rejects.toMatchObject({ status: 404 })
  })
})
