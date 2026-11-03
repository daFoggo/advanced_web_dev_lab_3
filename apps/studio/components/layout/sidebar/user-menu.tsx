"use client"

import { IconUser } from "@tabler/icons-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { useSidebar } from "@workspace/ui/components/sidebar"

/**
 * Account row pinned to the sidebar bottom: `└`, user icon, name, role; just the icon in the icon rail
 * (where the menu opens to the side). Menu items come from the caller (composition), e.g.
 * sign out from features/auth.
 */
export function UserMenu({
  name,
  email,
  role,
  children,
}: {
  name: string
  email: string | null
  role: string
  children: React.ReactNode
}) {
  const { state, isMobile } = useSidebar()
  const iconRail = state === "collapsed" && !isMobile
  const showRoleBadge =
    role && name.trim().toLowerCase() !== role.trim().toLowerCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-sidebar="menu-button"
        aria-label={`Tài khoản: ${name} [${role}]`}
        className="flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left font-mono text-sm text-muted-foreground transition-colors duration-150 group-data-[collapsible=icon]:justify-center hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground"
      >
        <IconUser
          aria-hidden
          className="size-4 shrink-0 text-muted-foreground"
        />
        <span
          aria-hidden
          data-sidebar="menu-glyph"
          className="-order-1 shrink-0 text-muted-foreground/50 group-data-[collapsible=icon]:hidden"
        >
          └
        </span>
        <span
          data-sidebar="menu-label"
          className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden"
        >
          {name}
        </span>
        {showRoleBadge ? (
          <span
            data-sidebar="menu-badge"
            className="ml-auto shrink-0 font-mono text-xs whitespace-nowrap text-muted-foreground group-data-[collapsible=icon]:hidden"
          >
            [{role}]
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={iconRail ? "right" : "top"}
        align={iconRail ? "end" : "start"}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="font-medium text-foreground">{name}</span>
            {email && (
              <span className="font-mono text-xs text-muted-foreground font-normal">
                {email}
              </span>
            )}
            <span className="font-mono text-[10px] text-muted-foreground">
              Vai trò: {role}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
