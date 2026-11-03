/** Single source of truth for authorization: every UI check, page, proxy rule and Server Action goes through `can`. */
export const ROLES = ["guest", "user", "admin"] as const
export type Role = (typeof ROLES)[number]

/** Roles a signed-in session can carry (`guest` means no session). */
export type SessionRole = Exclude<Role, "guest">

export const ACTIONS = [
  "deadline:view",
  "deadline:complete",
  "deadline:create",
  "deadline:delete",
] as const
export type Action = (typeof ACTIONS)[number]

/** Display names (Vietnamese UI). */
export const ROLE_LABEL: Record<Role, string> = {
  guest: "Khách",
  user: "Sinh viên",
  admin: "Lớp trưởng",
}

const MATRIX = {
  guest: ["deadline:view"],
  user: ["deadline:view", "deadline:complete"],
  admin: [
    "deadline:view",
    "deadline:complete",
    "deadline:create",
    "deadline:delete",
  ],
} satisfies Record<Role, readonly Action[]>

export function can(role: Role, action: Action): boolean {
  return (MATRIX[role] as readonly Action[]).includes(action)
}

/** Only the exact string "admin" grants admin; anything else falls back to the least privileged session role. */
export function parseRole(value: unknown): SessionRole {
  return value === "admin" ? "admin" : "user"
}

export function roleOf(session: { role: SessionRole } | null): Role {
  return session ? session.role : "guest"
}
