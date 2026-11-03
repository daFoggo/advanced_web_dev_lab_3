import { Suspense } from "react"

import { Skeleton } from "@workspace/ui/components/skeleton"

import { signOutAction } from "@/features/auth/actions"
import { SignOutButton } from "@/features/auth/components/sign-out-button"
import { getSession } from "@/lib/dal"

/**
 * Clean header action: sign-out button only.
 * Full user identity, email, and role badge are already pinned in the sidebar.
 */
async function AccountStatus() {
  const session = await getSession()
  if (!session) return null
  return <SignOutButton action={signOutAction} />
}

export function AppHeaderAccount() {
  return (
    <Suspense fallback={<Skeleton className="h-8 w-20" />}>
      <AccountStatus />
    </Suspense>
  )
}
