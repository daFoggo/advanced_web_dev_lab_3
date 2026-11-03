"use client"

import { useActionState, useState } from "react"
import { IconKey, IconUser, IconUserShield } from "@tabler/icons-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Spinner } from "@workspace/ui/components/spinner"

import { FormError } from "./form-error"
import { PasswordInput } from "./password-input"
import type { FormAction, SignInState } from "../types"

/** Email and password form with quick-fill testing accounts. */
export function SignInForm({
  action,
  callbackUrl,
}: {
  action: FormAction<SignInState>
  /** Where to go after signing in; the Server Action validates it again. */
  callbackUrl?: string
}) {
  const [state, formAction, pending] = useActionState(action, {})
  const [email, setEmail] = useState(state.values?.email ?? "")
  const [password, setPassword] = useState("")

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <FormError message={state.error} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          placeholder="ban@ptit.edu.vn"
          required
          disabled={pending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          placeholder="Nhập mật khẩu"
          disabled={pending}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-1 w-full"
        disabled={pending}
      >
        {pending ? (
          <>
            <Spinner data-icon="inline-start" />
            Đang đăng nhập…
          </>
        ) : (
          "Đăng nhập"
        )}
      </Button>

      {/* Quick-fill helper card for easy role testing */}
      <div className="mt-2 flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-foreground">
          <IconKey className="size-3.5 text-muted-foreground" />
          <span>Tài khoản kiểm thử bài tập:</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            className="flex flex-col items-start gap-0.5 h-auto py-2 text-left"
            onClick={() => {
              setEmail("sv@ptit.edu.vn")
              setPassword("sv123456")
            }}
          >
            <div className="flex items-center gap-1 font-medium text-foreground">
              <IconUser className="size-3" />
              <span>Sinh viên (User)</span>
            </div>
            <span className="font-mono text-muted-foreground">sv@ptit.edu.vn</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            className="flex flex-col items-start gap-0.5 h-auto py-2 text-left"
            onClick={() => {
              setEmail("admin@ptit.edu.vn")
              setPassword("admin123")
            }}
          >
            <div className="flex items-center gap-1 font-medium text-foreground">
              <IconUserShield className="size-3" />
              <span>Lớp trưởng (Admin)</span>
            </div>
            <span className="font-mono text-muted-foreground">admin@ptit.edu.vn</span>
          </Button>
        </div>
        <span className="text-muted-foreground">
          Bấm để điền nhanh email và mật khẩu tương ứng vào form.
        </span>
      </div>
    </form>
  )
}
