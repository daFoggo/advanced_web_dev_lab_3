import { randomUUID } from "node:crypto"

import { expect, test, type Page } from "@playwright/test"

/**
 * Two users on a real stack (`AUTH_PROVIDER=neon-auth`, `DATA_PROVIDER=neon`), run against a
 * disposable Neon branch: sign up, own data, sign out, tenant isolation. Skipped unless `E2E_NEON=1`.
 * Users and orgs it creates are left in that branch (delete the branch, or run it against `ci-test`).
 */
test.skip(!process.env.E2E_NEON, "needs E2E_NEON=1 and a Neon test branch")

const PASSWORD = "Test-pass-12345"

async function signUp(page: Page, name: string, email: string) {
  await page.goto("/sign-up")
  await page.getByLabel("Full name").fill(name)
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD)
  await page.getByLabel("Confirm password").fill(PASSWORD)
  await page.getByRole("button", { name: /^(sign up|create account)/i }).click()
  await page.waitForURL("**/dashboard", { timeout: 30_000 })
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: /^Account:/ }).click()
  await page.getByText("Sign out", { exact: true }).click()
  await page.waitForURL("**/sign-in")
}

test("two users: own data, sign out, tenant isolation", async ({ page }) => {
  // Cold pages cost seconds on a Neon branch that scales to zero; the default 30 s covers one sign-up at best.
  test.setTimeout(120_000)
  const run = randomUUID().slice(0, 8)
  const orgName = `E2E Org ${run}`
  const orgSlug = `e2e-org-${run}`
  const projectName = `E2E Web ${run}`

  // User A signs up and creates an org, then a project in it.
  await signUp(page, "E2E User A", `e2e-a-${run}@example.test`)
  await page.goto("/dashboard/organizations")
  await expect(page.getByText(orgName)).toHaveCount(0)
  await page.getByRole("button", { name: "New organization" }).click()
  await page.getByLabel("Name").fill(orgName)
  await page.getByRole("button", { name: "Create organization" }).click()
  await page.waitForURL(`**/org/${orgSlug}`)

  await page.goto(`/org/${orgSlug}/projects`)
  await page.getByRole("button", { name: "New project" }).first().click()
  await page.getByLabel("Name").fill(projectName)
  await page.getByRole("button", { name: "Create project" }).click()
  await page.waitForURL(`**/project/e2e-web-${run}`)

  // A reload keeps the data (it comes from the database, not memory).
  await page.goto("/dashboard/organizations")
  await expect(page.getByText(orgName).first()).toBeVisible()

  // Signed out: protected pages go to sign-in.
  await signOut(page)
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/sign-in/)

  // Wrong password keeps the user signed out with a message.
  await page.getByLabel("Email").fill(`e2e-a-${run}@example.test`)
  await page.getByLabel("Password", { exact: true }).fill("wrong-password-1")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/sign-in/)
  await expect(page.getByRole("alert")).toBeVisible()

  // User B sees none of A's data and cannot open A's org or project.
  await signUp(page, "E2E User B", `e2e-b-${run}@example.test`)
  await page.goto("/dashboard/organizations")
  await expect(page.getByText(orgName)).toHaveCount(0)
  // Status is already 200 when notFound() runs inside a streamed Suspense boundary: assert on the content.
  for (const path of [`/org/${orgSlug}`, `/project/e2e-web-${run}`]) {
    await page.goto(path)
    await expect(
      page.getByRole("heading", { name: "Page not found" })
    ).toBeVisible()
    await expect(page.getByText(orgName)).toHaveCount(0)
  }

  // A signs back in and still owns everything.
  await signOut(page)
  await page.getByLabel("Email").fill(`e2e-a-${run}@example.test`)
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await page.waitForURL("**/dashboard", { timeout: 30_000 })
  await page.goto("/dashboard/organizations")
  await expect(page.getByText(orgName).first()).toBeVisible()
})
