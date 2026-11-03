"use server"

import { updateTag } from "next/cache"
import { redirect } from "next/navigation"

import { SignInSchema } from "@workspace/auth/schemas"
import type { SignInState } from "./types"

import { HOME_PATH } from "@/config/routes"
import { getAuthProvider } from "@/lib/auth"
import { SESSION_TAG } from "@/lib/dal"
import { safeCallbackUrl } from "@/lib/safe-redirect"

/** Vietnamese copy for a rejection by the identity system (its own messages are English). */
function rejectionMessage(error: unknown): string {
  const status = (error as { status?: number }).status
  if (status === 429)
    return "Bạn thử quá nhiều lần. Vui lòng đợi một lúc rồi thử lại."
  return "Email hoặc mật khẩu không đúng."
}

export async function signInAction(
  _previous: SignInState,
  formData: FormData
): Promise<SignInState> {
  const values = { email: String(formData.get("email") ?? "") }
  // Only same-origin internal paths survive; anything else lands on the dashboard.
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"))
  const parsed = SignInSchema.safeParse({
    email: values.email,
    password: formData.get("password"),
  })
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ",
      values,
    }
  }

  const provider = await getAuthProvider()
  try {
    await provider.signIn(parsed.data)
  } catch (error) {
    if (!provider.isExpectedError(error)) {
      console.error("[signInAction] unexpected error:", error)
      return {
        error: "Không kết nối được máy chủ đăng nhập. Vui lòng thử lại sau.",
        values,
      }
    }
    return { error: rejectionMessage(error), values }
  }

  // getSession() is "use cache: private" and only reruns for a new cookie once its tag
  // is invalidated — without this, the dashboard can keep rendering the signed-out shell.
  updateTag(SESSION_TAG)
  // redirect() throws, so it must stay outside the try/catch.
  redirect(callbackUrl)
}

export async function signOutAction(): Promise<void> {
  const provider = await getAuthProvider()
  await provider.signOut()
  updateTag(SESSION_TAG)
  redirect(HOME_PATH)
}
