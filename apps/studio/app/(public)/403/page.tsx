import type { Metadata } from "next"

import { ForbiddenView } from "@/components/shared/forbidden-view"

export const metadata: Metadata = {
  title: "Không có quyền truy cập",
  robots: { index: false },
}

export default function ForbiddenPage() {
  return <ForbiddenView />
}
