"use client"

import { useSyncExternalStore } from "react"

import { Badge } from "@workspace/ui/components/badge"

import { describeCountdown } from "../countdown"

let clientNow = Date.now()
const listeners = new Set<() => void>()

if (typeof window !== "undefined") {
  setInterval(() => {
    clientNow = Date.now()
    listeners.forEach((listener) => listener())
  }, 60_000)
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

function getSnapshot(): number {
  return clientNow
}

function getServerSnapshot(): number | null {
  return null
}

export function Countdown({
  dueAt,
  completed,
}: {
  dueAt: string | Date
  completed?: boolean
}) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (completed) {
    return <Badge variant="secondary">Đã xong</Badge>
  }

  if (now === null) {
    const d = new Date(dueAt)
    const formatted = d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    })
    return <Badge variant="outline">Hạn {formatted}</Badge>
  }

  const { kind, text } = describeCountdown(dueAt, new Date(now))
  const variant =
    kind === "overdue"
      ? "destructive"
      : kind === "hours"
        ? "default"
        : "outline"

  return <Badge variant={variant}>{text}</Badge>
}
