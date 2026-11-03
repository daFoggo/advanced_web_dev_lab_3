"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import { applyFilters, parseFilters, type DeadlineFilter } from "../filters"
import type { Deadline, Subject } from "../schemas"
import { DeadlineList } from "./deadline-list"

export function FilteredDeadlines({
  initialDeadlines,
  subjects,
}: {
  initialDeadlines: Deadline[]
  subjects: Subject[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  const filtered = useMemo(
    () => applyFilters(initialDeadlines, filters),
    [initialDeadlines, filters]
  )

  const updateFilters = (updates: Partial<DeadlineFilter>) => {
    const next = new URLSearchParams(searchParams.toString())
    const merged = { ...filters, ...updates }

    if (merged.subject && merged.subject !== "all") {
      next.set("subject", merged.subject)
    } else {
      next.delete("subject")
    }

    if (merged.status && merged.status !== "all") {
      next.set("status", merged.status)
    } else {
      next.delete("status")
    }

    if (merged.sort && merged.sort !== "due-asc") {
      next.set("sort", merged.sort)
    } else {
      next.delete("sort")
    }

    const query = next.toString()
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Tabs
            value={filters.status ?? "all"}
            onValueChange={(val) =>
              updateFilters({
                status: val as "all" | "upcoming" | "overdue",
              })
            }
          >
            <TabsList>
              <TabsTrigger value="all">Tất cả ({initialDeadlines.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Sắp tới</TabsTrigger>
              <TabsTrigger value="overdue">Quá hạn</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select
            value={filters.subject ?? "all"}
            onValueChange={(val) => updateFilters({ subject: val ?? "all" })}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Tất cả môn học">
                {(val) => {
                  if (!val || val === "all") return "Tất cả môn học"
                  return (
                    subjects.find((s) => s.slug === val)?.name ?? "Tất cả môn học"
                  )
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tất cả môn học</SelectItem>
                {subjects.map((sub) => (
                  <SelectItem key={sub.id} value={sub.slug}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Select
          value={filters.sort ?? "due-asc"}
          onValueChange={(val) =>
            updateFilters({
              sort: (val ?? "due-asc") as "due-asc" | "due-desc",
            })
          }
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Sắp xếp theo hạn">
              {(val) =>
                val === "due-desc"
                  ? "Hạn: Xa nhất trước"
                  : "Hạn: Gần nhất trước"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="due-asc">Hạn: Gần nhất trước</SelectItem>
              <SelectItem value="due-desc">Hạn: Xa nhất trước</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <DeadlineList deadlines={filtered} />
    </div>
  )
}
