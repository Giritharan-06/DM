import { test, expect } from "@playwright/test";
const crm = "http://localhost:3001";
test("CRM preview navigation, task filters and calendar", async ({
  page,
}, info) => {
  await page.goto(`${crm}/preview/tasks`);
  await expect(
    page.getByRole("heading", { name: "Tasks", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Development preview · Illustrative records only"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add task", exact: true }),
  ).toBeDisabled();
  await page.getByRole("textbox", { name: "Search tasks" }).fill("creative");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("1 records · Page 1")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByRole("button", { name: "Kanban view" }).click();
  await expect(
    page.getByRole("region", { name: "in progress tasks" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Status for Prepare campaign creative"),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Calendar view" }).click();
  await expect(
    page.getByRole("table", { name: "tasks monthly calendar" }),
  ).toBeVisible();
  await expect(page.locator(".month-grid tbody td")).toHaveCount(42);
  const before = await page.locator(".calendar-heading h2").textContent();
  await page.getByRole("button", { name: "Next month" }).click();
  await expect(page.locator(".calendar-heading h2")).not.toHaveText(before!);
  await page.getByRole("button", { name: "Today", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `artifacts/crm-calendar-${info.project.name}.png`,
    fullPage: true,
  });
});
test("CRM settings shows enforced role access", async ({ page }) => {
  await page.goto(`${crm}/preview/settings`);
  await page.getByRole("tab", { name: "Roles & access" }).click();
  await expect(
    page.getByRole("heading", { name: "Roles & access" }),
  ).toBeVisible();
  await expect(page.locator(".permission-table")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("CRM dashboard and client filters render without database writes", async ({
  page,
}, info) => {
  await page.goto(`${crm}/preview`);
  await expect(page.locator('.recharts-bar-rectangle path').first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Lead sources" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Revenue received" }),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/crm-dashboard-${info.project.name}.png`,
    fullPage: true,
  });
  await page.goto(`${crm}/preview/clients`);
  await page.getByRole("textbox", { name: "Search clients" }).fill("dental");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("1 records · Page 1")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add client", exact: true }),
  ).toBeDisabled();
});
