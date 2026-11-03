"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="vi">
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "rgb(250, 250, 250)",
          color: "rgb(24, 24, 27)",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
          Đã xảy ra lỗi
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            margin: 0,
            opacity: 0.75,
            maxWidth: "24rem",
          }}
        >
          Đã xảy ra lỗi nghiêm trọng. Vui lòng tải lại trang hoặc thử lại.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            cursor: "pointer",
            borderRadius: "0.375rem",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            background: "rgb(24, 24, 27)",
            color: "rgb(255, 255, 255)",
            border: "none",
          }}
        >
          Thử lại
        </button>
      </body>
    </html>
  )
}
