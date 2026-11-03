import { createAuthHandler } from "@workspace/auth/auth-handler"

// Neon Auth proxy only; 404 on the other stacks.
export const { GET, POST, PUT, PATCH, DELETE } = createAuthHandler()
