import assert from "node:assert/strict";
import { chromium } from "playwright";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const biddingOrigin = new URL(required("BIDDING_OIDC_TEST_ORIGIN")).origin;
const identityOrigin = new URL(required("CENTRAL_IDENTITY_TEST_ORIGIN")).origin;
const email = required("CENTRAL_IDENTITY_TEST_EMAIL");
const password = required("CENTRAL_IDENTITY_TEST_PASSWORD");
const destination = process.env.BIDDING_OIDC_TEST_DESTINATION ?? "/dashboard";
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const target = new URL(destination, biddingOrigin);
  await page.goto(target.href);
  await page.waitForURL((url) => url.origin === identityOrigin && url.pathname.endsWith("/sign-in"));
  await page.getByLabel("Username or email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => url.origin === target.origin && url.pathname === target.pathname);
  assert.ok(await page.evaluate(async () => Boolean(await (await fetch("/api/auth/get-session")).json())));

  await page.getByRole("button", { name: "Book Bidding sign-out" }).click();
  await page.waitForURL((url) => url.origin === target.origin && url.pathname === "/auth/login" && url.searchParams.get("manual") === "1");
  await page.waitForTimeout(1_000);
  assert.equal(new URL(page.url()).origin, target.origin, "local sign-out must not restart Central authorization");
  assert.equal(await page.evaluate(async () => await (await fetch("/api/auth/get-session")).json()), null);

  await page.goto(target.href);
  await page.waitForURL((url) => url.origin === target.origin && url.pathname === target.pathname);
  assert.ok(await page.evaluate(async () => Boolean(await (await fetch("/api/auth/get-session")).json())));
} finally {
  await browser.close();
}
