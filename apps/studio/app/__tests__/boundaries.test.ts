import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import RootError from "../error"
import AuthError from "../(auth)/error"
import DashboardError from "../(app)/dashboard/error"
import DeadlinesError from "../(public)/deadlines/(list)/error"
import ForbiddenPage from "../(public)/403/page"
import Forbidden from "../forbidden"
import NotFound from "../not-found"
import GlobalError from "../global-error"

const props = { error: new Error("test"), retry: () => {} }

describe("boundaries", () => {
  it.each([
    ["root", RootError],
    ["auth", AuthError],
    ["dashboard", DashboardError],
    ["deadlines list", DeadlinesError],
  ])("%s error renders Vietnamese copy and a retry button", (_name, Boundary) => {
    const html = renderToStaticMarkup(createElement(Boundary, props))
    expect(html).toContain("Thử lại")
    expect(html).not.toContain("Try again")
    expect(html).not.toContain("Something went wrong")
  })

  it("not-found renders Vietnamese copy and links home", () => {
    const html = renderToStaticMarkup(createElement(NotFound))
    expect(html).toContain("Không tìm thấy trang")
    expect(html).toContain('href="/"')
  })

  it("forbidden.tsx and the /403 page share one view", () => {
    const fromBoundary = renderToStaticMarkup(createElement(Forbidden))
    const fromPage = renderToStaticMarkup(createElement(ForbiddenPage))
    expect(fromBoundary).toBe(fromPage)
    expect(fromBoundary).toContain("403")
    expect(fromBoundary).toContain("Bạn không có quyền xem trang này.")
    expect(fromBoundary).toContain('href="/"')
  })

  it("global error renders Vietnamese copy, lang=vi, and retry button", () => {
    const html = renderToStaticMarkup(createElement(GlobalError, props))
    expect(html).toContain('lang="vi"')
    expect(html).toContain("Đã xảy ra lỗi")
    expect(html).toContain("Thử lại")
    expect(html).not.toContain("Application error")
    expect(html.includes("dark" + ":")).toBe(false)
    expect(html).not.toContain("text-gray-500")
  })
})
