"use client"

import {
  IconBrandGoogle,
  IconShieldLock,
  IconSparkles,
} from "@tabler/icons-react"
import { useActionState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { toast } from "@workspace/ui/components/toast"

type SocialAuthButtonsProps = {
  activeProvider:
    "neon-auth" | "supabase" | "keycloak" | "fastapi-oauth"
  mode?: "sign-in" | "sign-up"
  hasDemo?: boolean
  googleEnabled?: boolean
  keycloakAction: () => Promise<void>
  googleAction?: () => Promise<void>
  demoAction?: (
    _previous: { error?: string },
    _formData: FormData
  ) => Promise<{ error?: string }>
}

export function SocialAuthButtons({
  activeProvider,
  mode = "sign-in",
  hasDemo = false,
  googleEnabled = false,
  keycloakAction,
  googleAction,
  demoAction,
}: SocialAuthButtonsProps) {
  const isKeycloakActive = activeProvider === "keycloak"
  const isGoogleActive = googleEnabled

  const [_demoState, demoFormAction, demoPending] = useActionState(
    demoAction ?? (async () => ({})),
    {}
  )

  const handleKeycloakClick = () => {
    if (!isKeycloakActive) {
      toast.add({
        title: "Provider not configured",
        description: `Keycloak SSO is not enabled on this deployment (active: ${activeProvider}).`,
        type: "error",
      })
    }
  }

  const handleGoogleClick = () => {
    if (!isGoogleActive) {
      toast.add({
        title: "Provider not configured",
        description:
          "Google login is not enabled on this deployment. Please enable Google provider in config.",
        type: "error",
      })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="flex w-full items-center gap-2">
        {/* Keycloak SSO Button */}
        {isKeycloakActive ? (
          <form action={keycloakAction} className="flex-1">
            <Button
              type="submit"
              variant="outline"
              size="default"
              className="w-full gap-2 text-xs sm:text-sm"
              title={
                mode === "sign-up"
                  ? "Create account with Keycloak"
                  : "Continue with Keycloak SSO"
              }
            >
              <IconShieldLock className="size-4 shrink-0 text-primary" />
              <span className="truncate">Keycloak</span>
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="default"
            className="flex-1 gap-2 text-xs opacity-75 hover:opacity-100 sm:text-sm"
            onClick={handleKeycloakClick}
            title="Continue with Keycloak SSO"
          >
            <IconShieldLock className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">Keycloak</span>
          </Button>
        )}

        {/* Google Button */}
        {isGoogleActive && googleAction ? (
          <form action={googleAction} className="flex-1">
            <Button
              type="submit"
              variant="outline"
              size="default"
              className="w-full gap-2 text-xs sm:text-sm"
              title="Continue with Google"
            >
              <IconBrandGoogle className="size-4 shrink-0" />
              <span className="truncate">Google</span>
            </Button>
          </form>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="default"
            className="flex-1 gap-2 text-xs opacity-75 hover:opacity-100 sm:text-sm"
            onClick={handleGoogleClick}
            title="Continue with Google"
          >
            <IconBrandGoogle className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">Google</span>
          </Button>
        )}

        {/* Demo Sign-in Button */}
        {hasDemo && demoAction ? (
          <form action={demoFormAction} className="flex-1">
            <Button
              type="submit"
              variant="secondary"
              size="default"
              className="w-full gap-2 text-xs sm:text-sm"
              disabled={demoPending}
              title="Demo sign in (instant access)"
            >
              {demoPending ? (
                <Spinner className="size-4 shrink-0" />
              ) : (
                <IconSparkles className="size-4 shrink-0" />
              )}
              <span className="truncate">Demo</span>
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  )
}
