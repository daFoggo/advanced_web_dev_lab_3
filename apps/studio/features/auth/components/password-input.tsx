"use client"

import { useState } from "react"
import { IconEye, IconEyeOff } from "@tabler/icons-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/input-group"

type PasswordInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  "type"
> & {
  autoComplete: "current-password" | "new-password"
}

export function PasswordInput({
  id,
  name,
  autoComplete,
  placeholder,
  disabled,
  className,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <InputGroup className={className}>
      <InputGroupInput
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        minLength={6}
        maxLength={128}
        disabled={disabled}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
