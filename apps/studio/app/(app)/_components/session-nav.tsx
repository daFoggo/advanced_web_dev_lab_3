import { can, roleOf, ROLE_LABEL } from "@workspace/auth/permissions"
import { SignOutMenuItem } from "@/features/auth/components/sign-out-menu-item"

import { ScopedNav } from "@/components/layout/sidebar/scoped-nav"
import { UserMenu } from "@/components/layout/sidebar/user-menu"
import { NAV_SCOPES, filterNav } from "@/config/navigation"
import { signOutAction } from "@/features/auth/actions"
import { getSession } from "@/lib/dal"

/** Hides links (and whole sections) the role cannot open; pages still enforce access with `requireCan`. */
export async function SessionNav() {
  const session = await getSession()
  if (!session) return null
  const role = roleOf(session)
  const scopes = filterNav(NAV_SCOPES, (action) => can(role, action))
  return <ScopedNav scopes={scopes} />
}

export async function SessionAccount() {
  const session = await getSession()
  if (!session) return null
  return (
    <UserMenu
      name={session.name ?? session.email ?? "Tài khoản"}
      email={session.email}
      role={ROLE_LABEL[session.role]}
    >
      <SignOutMenuItem action={signOutAction} />
    </UserMenu>
  )
}
