"use client"

import { useTransition } from "react"

import { Button } from "@workspace/ui/components/button"

/** Header sign-out. The app owns the logic: pass the Server Action (or any async function) that signs out. */
export function SignOutButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => action())}
    >
      {pending ? "Đang đăng xuất…" : "Đăng xuất"}
    </Button>
  )
}
