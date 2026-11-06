// Drives the main flows against a running mock-mode server. Usage: MOCK=1 npm run dev, then
//   NODE_PATH="$(npm root -g)" node scripts/smoke.mjs [baseUrl] [password]
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.argv[2] ?? "http://localhost:3000";
const password = process.argv[3] ?? process.env.MISSION_CONTROL_PASSWORD ?? "dev-password";

async function step(name, work) {
  process.stdout.write(`• ${name} … `);
  await work();
  console.log("ok");
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(15_000);

  await step("redirects to login when signed out", async () => {
    await page.goto(`${base}/runs`);
    await page.waitForURL("**/login?next=%2Fruns");
  });

  await step("rejects a wrong password", async () => {
    await page.fill('input[name="password"]', "wrong");
    await page.click('button[type="submit"]');
    await page.getByText("Wrong password").waitFor();
  });

  await step("signs in", async () => {
    await page.fill('input[name="password"]', password);
    await Promise.all([page.waitForURL("**/runs"), page.click('button[type="submit"]')]);
  });

  await step("approves a waiting tool call", async () => {
    await page.goto(`${base}/runs/sesn_mock_review`);
    await page.getByRole("button", { name: "Allow" }).click();
    await page.getByText("The branch has the fix", { exact: false }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Allow" }).count(), 0);
  });

  await step("sends a message and streams the reply", async () => {
    await page.goto(`${base}/runs/sesn_mock_handicap`);
    await page.getByLabel(/Message the agent/).fill("Please fix both regressions");
    await page.keyboard.press("Enter");
    await page.getByText("Please fix both regressions").waitFor();
    await page.getByText("I'll report back with a branch name", { exact: false }).waitFor();
  });

  await step("interrupts a running run", async () => {
    await page.goto(`${base}/runs/sesn_mock_shotmap`);
    await page.getByRole("button", { name: "Interrupt" }).click();
    await page.getByText("You interrupted the agent").waitFor();
    await page.getByRole("button", { name: "Interrupt" }).waitFor({ state: "detached" });
  });

  await step("expands a tool call", async () => {
    await page.getByRole("button", { name: /bash npx jest hooks/ }).click();
    await page.getByText("✓ computes yards to pin", { exact: false }).waitFor();
  });

  await step("starts a new run", async () => {
    await page.goto(`${base}/runs/new`);
    await page.getByLabel("First message").fill("Add a dark mode toggle to settings");
    await page.getByRole("button", { name: "Start run" }).click();
    await page.waitForURL(/\/runs\/sesn_mock_/);
    await page.getByRole("heading", { name: "Add a dark mode toggle to settings" }).waitFor();
    await page.getByText("I'll report back", { exact: false }).waitFor();
  });

  await step("creates an agent from a role template", async () => {
    await page.goto(`${base}/agents/new`);
    await page.getByRole("button", { name: "QA" }).click();
    await page.getByLabel("Name").fill("QA (nightly)");
    await page.getByRole("button", { name: "Create agent" }).click();
    await page.waitForURL("**/agents");
    await page.getByRole("heading", { name: "QA (nightly)" }).waitFor();
  });

  await step("filters runs by status", async () => {
    await page.goto(`${base}/runs?status=ended`);
    const rows = await page.locator("main li").count();
    assert.equal(rows, 2);
  });

  await browser.close();
}

main().catch((error) => {
  console.error("\n", error);
  process.exit(1);
});
