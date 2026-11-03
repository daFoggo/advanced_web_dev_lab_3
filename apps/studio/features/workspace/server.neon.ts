import "server-only"

import { eq, inArray } from "drizzle-orm"

import { getDb } from "@workspace/db/neon"
import { orgs, projects } from "@workspace/db/neon/schema"

import { ApiError } from "@/lib/errors"

import {
  OrgSchema,
  ProjectSchema,
  slugify,
  type CreateOrgInput,
  type CreateProjectInput,
  type Org,
  type Project,
} from "./schemas"
import type * as Mock from "./server.mock"

/**
 * `DATA_PROVIDER=neon`: Drizzle over Neon Postgres. Same signatures and DTOs as `server.mock.ts`
 * (`satisfies` below makes `tsc` fail when they drift). Tenant boundary: every query filters by
 * `viewerId` (the identity provider's user id); a request for another user's org looks like a missing one.
 */
const UNIQUE_VIOLATION = "23505"

function isUniqueViolation(error: unknown) {
  const cause = (error as { cause?: { code?: string } })?.cause
  return (cause?.code ?? (error as { code?: string })?.code) === UNIQUE_VIOLATION
}

export async function fetchOrgs(viewerId: string): Promise<Org[]> {
  const rows = await getDb()
    .select()
    .from(orgs)
    .where(eq(orgs.ownerId, viewerId))
    .orderBy(orgs.createdAt)
  return OrgSchema.array().parse(rows)
}

export async function fetchProjects(viewerId: string): Promise<Project[]> {
  const db = getDb()
  const owned = db
    .select({ slug: orgs.slug })
    .from(orgs)
    .where(eq(orgs.ownerId, viewerId))
  const rows = await db
    .select()
    .from(projects)
    .where(inArray(projects.orgSlug, owned))
    .orderBy(projects.createdAt)
  return ProjectSchema.array().parse(rows)
}

export async function insertOrg(
  viewerId: string,
  input: CreateOrgInput
): Promise<Org> {
  const slug = slugify(input.name)
  if (slug.length < 3)
    throw new ApiError(422, "Use letters or numbers in the name")
  try {
    const [row] = await getDb()
      .insert(orgs)
      .values({ slug, name: input.name, ownerId: viewerId })
      .returning()
    return OrgSchema.parse(row)
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(409, "An organization with this name already exists")
    }
    throw error
  }
}

export async function insertProject(
  viewerId: string,
  orgSlug: string,
  input: CreateProjectInput
): Promise<Project> {
  const db = getDb()
  const [target] = await db
    .select({ ownerId: orgs.ownerId })
    .from(orgs)
    .where(eq(orgs.slug, orgSlug))
  if (!target) throw new ApiError(404, "Organization not found")
  if (target.ownerId !== viewerId) {
    throw new ApiError(
      403,
      "You do not have permission to create projects in this organization"
    )
  }

  const ref = slugify(input.name)
  if (ref.length < 3)
    throw new ApiError(422, "Use letters or numbers in the name")
  try {
    const [row] = await db
      .insert(projects)
      .values({ ref, name: input.name, orgSlug, region: input.region })
      .returning()
    return ProjectSchema.parse(row)
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ApiError(409, "A project with this name already exists")
    }
    throw error
  }
}

// Compile-time parity with the mock (the reference signatures).
export const parity = {
  fetchOrgs,
  fetchProjects,
  insertOrg,
  insertProject,
} satisfies Pick<
  typeof Mock,
  "fetchOrgs" | "fetchProjects" | "insertOrg" | "insertProject"
>
