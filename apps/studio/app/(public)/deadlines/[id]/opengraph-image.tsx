import { ImageResponse } from "next/og"

import { getDeadline } from "@/features/deadlines/queries"
import { DeadlineIdSchema } from "@/features/deadlines/schemas"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params
  const idResult = DeadlineIdSchema.safeParse(rawId)
  if (!idResult.success) {
    return new Response("Not found", { status: 404 })
  }

  const deadline = await getDeadline(idResult.data)
  if (!deadline) {
    return new Response("Not found", { status: 404 })
  }

  const dueDate = new Date(deadline.dueAt)
  const formattedDueDate = dueDate.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  })

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 60,
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: "6px 14px",
                borderRadius: 9999,
                backgroundColor: "#27272a",
                color: "#e4e4e7",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              {deadline.subject?.code ?? "MÔN HỌC"}
            </div>
            <div style={{ fontSize: 22, color: "#a1a1aa" }}>
              {deadline.subject?.name}
            </div>
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.2,
              color: "#ffffff",
              marginTop: 20,
            }}
          >
            {deadline.title}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "1px solid #27272a",
            paddingTop: 30,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 18, color: "#a1a1aa" }}>HẠN NỘP BÀI</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: "#38bdf8" }}>
              {formattedDueDate}
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#71717a" }}>
            Class Deadline Hub
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
