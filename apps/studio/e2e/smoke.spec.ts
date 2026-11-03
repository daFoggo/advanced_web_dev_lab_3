import { expect, test, type Page } from "@playwright/test"

/** Collects console errors, page errors and failed font requests for one page. */
function watch(page: Page) {
  const errors: string[] = []
  const fonts: string[] = []
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[${page.url()}] ${msg.text()}`)
  })
  page.on("pageerror", (err) => errors.push(`[${page.url()}] ${err.message}`))
  page.on("requestfailed", (req) => {
    if (req.url().includes(".woff2")) fonts.push(req.url())
  })
  return { errors, fonts }
}

test.describe("Smoke", () => {
  test("home renders in Vietnamese", async ({ page }) => {
    const { errors, fonts } = watch(page)
    const response = await page.goto("/")
    expect(response?.status()).toBe(200)
    await expect(page.locator("html")).toHaveAttribute("lang", "vi")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    expect(fonts).toEqual([])
    expect(errors).toEqual([])
  })

  test("login renders the form", async ({ page }) => {
    const { errors } = watch(page)
    const response = await page.goto("/login")
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(/Đăng nhập/)
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible()
    expect(errors).toEqual([])
  })

  test("dashboard redirects to login without a session", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForURL("**/login**")
    expect(new URL(page.url()).pathname).toBe("/login")
  })

  test("unknown deadline id is a real 404", async ({ request }) => {
    expect((await request.get("/deadlines/abc")).status()).toBe(404)
  })
})
