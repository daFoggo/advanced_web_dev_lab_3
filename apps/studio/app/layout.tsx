import type { Metadata } from "next"
import { Geist, Geist_Mono, STIX_Two_Text } from "next/font/google"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@workspace/ui-patterns/theme-provider"
import { WebVitals } from "@/components/shared/web-vitals"
import { Toaster } from "@workspace/ui/components/toast"
import { cn } from "@workspace/ui/lib/utils"
import { publicEnv } from "@/lib/env.public"

export const metadata: Metadata = {
  // Makes relative canonicals (`/some/path`) absolute.
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_APP_URL),
  title: {
    default: "Class Deadline Hub",
    template: "%s | Class Deadline Hub",
  },
  description:
    "Theo dõi deadline môn học của lớp: xem hạn nộp, đánh dấu đã xong và quản lý deadline.",
}

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  preload: false,
  display: "swap",
})

// Registered for `font-serif` only; no component uses it by default.
const fontSerif = STIX_Two_Text({
  subsets: ["latin", "vietnamese"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  preload: false,
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        fontSans.variable,
        fontSerif.variable
      )}
    >
      <body>
        <ThemeProvider>
          <Toaster>{children}</Toaster>
          <WebVitals />
        </ThemeProvider>
      </body>
    </html>
  )
}
