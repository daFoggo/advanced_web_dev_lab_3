import "server-only"

import { env } from "@/lib/env"

import * as mock from "./server.mock"
import * as neon from "./server.neon"

/**
 * The only place that talks to the backend; picks the data path by `DATA_PROVIDER` (docs/providers.md).
 * Both implementations share signatures and DTOs (`server.neon.ts` is type-checked against the mock).
 */
const impl = env.DATA_PROVIDER === "neon" ? neon : mock

export const fetchOrgs = impl.fetchOrgs
export const fetchProjects = impl.fetchProjects
export const insertOrg = impl.insertOrg
export const insertProject = impl.insertProject
