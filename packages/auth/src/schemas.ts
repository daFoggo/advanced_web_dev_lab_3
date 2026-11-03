import { z } from "zod"

export const SignInSchema = z.object({
  email: z.email("Email không hợp lệ"),
  password: z
    .string()
    .min(6, "Mật khẩu tối thiểu 6 ký tự")
    .max(128, "Mật khẩu tối đa 128 ký tự"),
})

export type SignInInput = z.infer<typeof SignInSchema>
