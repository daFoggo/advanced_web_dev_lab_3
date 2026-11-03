import type { Metadata } from "next"
import { Suspense } from "react"

import { FormError } from "@/features/auth/components/form-error"
import { SignInForm } from "@/features/auth/components/sign-in-form"

import { signInAction } from "@/features/auth/actions"
import { safeCallbackUrl } from "@/lib/safe-redirect"

import {
  AuthAside,
  AuthBody,
  AuthHeader,
  AuthHeading,
  AuthMain,
  AuthPitch,
} from "../_components/auth-frame"

export const metadata: Metadata = {
  title: "Đăng nhập",
  robots: { index: false, follow: false },
}

type LoginSearchParams = Promise<{ error?: string; callbackUrl?: string }>

/** Reads the query inside <Suspense> (runtime data): the page frame stays static. */
async function LoginPanel({ searchParams }: { searchParams: LoginSearchParams }) {
  const { error, callbackUrl } = await searchParams
  return (
    <>
      {error ? (
        <FormError message="Đăng nhập không thành công. Vui lòng thử lại." />
      ) : null}
      <SignInForm
        action={signInAction}
        callbackUrl={safeCallbackUrl(callbackUrl)}
      />
    </>
  )
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: LoginSearchParams
}) {
  return (
    <>
      <AuthAside>
        <AuthPitch title="Không bỏ lỡ deadline nào.">
          Theo dõi hạn nộp bài của cả lớp và đánh dấu những việc đã xong.
        </AuthPitch>
      </AuthAside>
      <AuthMain>
        <AuthHeader />
        <AuthBody>
          <AuthHeading title="Đăng nhập">
            Dùng tài khoản của lớp để tiếp tục.
          </AuthHeading>
          <div className="flex flex-col gap-4">
            <Suspense fallback={<SignInForm action={signInAction} />}>
              <LoginPanel searchParams={searchParams} />
            </Suspense>
          </div>
        </AuthBody>
      </AuthMain>
    </>
  )
}
