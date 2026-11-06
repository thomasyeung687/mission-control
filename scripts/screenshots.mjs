// Captures the main screens in mock mode. Usage: MOCK=1 npm run dev, then
//   node scripts/screenshots.mjs [baseUrl] [password]
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";

// Uses the globally installed Playwright (run with NODE_PATH="$(npm root -g)").
const { chromium, devices } = createRequire(import.meta.url)("playwright");

const base = process.argv[2] ?? "http://localhost:3000";
const password = process.argv[3] ?? process.env.MISSION_CONTROL_PASSWORD ?? "dev-password";
const outDir = new URL("../screenshots/", import.meta.url).pathname;

const pages = [
  { name: "runs", path: "/runs" },
  { name: "run-waiting", path: "/runs/sesn_mock_review" },
  { name: "run-running", path: "/runs/sesn_mock_shotmap", settle: 4500 },
  { name: "inbox", path: "/inbox" },
  { name: "agents", path: "/agents" },
  { name: "new-run", path: "/runs/new" },
];

const viewports = [
  { label: "desktop", options: { viewport: { width: 1280, height: 820 }, deviceScaleFactor: 1 } },
  { label: "phone", options: { ...devices["iPhone 13"] } },
];

async function login(context) {
  const page = await context.newPage();
  await page.goto(`${base}/login`);
  await page.fill('input[name="password"]', password);
  await Promise.all([page.waitForURL("**/runs"), page.click('button[type="submit"]')]);
  await page.close();
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  for (const scheme of ["light", "dark"]) {
    for (const { label, options } of viewports) {
      const context = await browser.newContext({ ...options, colorScheme: scheme });
      await login(context);
      const page = await context.newPage();
      for (const shot of pages) {
        await page.goto(`${base}${shot.path}`);
        await page.waitForLoadState("networkidle").catch(() => undefined);
        await page.waitForTimeout(shot.settle ?? 1200);
        await page.screenshot({ path: `${outDir}${shot.name}-${label}-${scheme}.png` });
      }
      await context.close();
    }
  }
  await browser.close();
  console.log(`Saved screenshots to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
