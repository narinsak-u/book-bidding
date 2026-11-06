import assert from "node:assert/strict";
import { chromium } from "playwright";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const biddingOrigin = new URL(required("BIDDING_OIDC_TEST_ORIGIN")).origin;
const readingOrigin = new URL(required("READING_OIDC_TEST_ORIGIN")).origin;
const identityOrigin = new URL(required("CENTRAL_IDENTITY_TEST_ORIGIN")).origin;
const email = required("CENTRAL_IDENTITY_TEST_EMAIL");
const password = required("CENTRAL_IDENTITY_TEST_PASSWORD");
const biddingDestination = process.env.BIDDING_OIDC_TEST_DESTINATION ?? "/dashboard";
const readingDestination = process.env.READING_OIDC_TEST_DESTINATION ?? "/dashboard";
const coldStartTimeout = 90_000;
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const biddingTarget = new URL(biddingDestination, biddingOrigin);
  console.log("Checking Bidding sign-in");
  await page.goto(biddingTarget.href, { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
  await page.waitForURL((url) => url.origin === identityOrigin && url.pathname.endsWith("/sign-in"), { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
  await page.getByLabel("Username or email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  console.log("Checking Bidding application session");
  await page.waitForURL((url) => url.origin === biddingTarget.origin && url.pathname === biddingTarget.pathname && url.search === biddingTarget.search, { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
  const biddingSession = await page.evaluate(async () => await (await fetch("/api/auth/get-session")).json());
  assert.ok(biddingSession, "Bidding must establish an Application Session");
  const biddingCookies = await context.cookies(biddingOrigin);
  const biddingSessionCookie = biddingCookies.find((cookie) => cookie.name.endsWith("session_token"));
  assert.ok(biddingSessionCookie, "Bidding must use a session cookie");
  assert.equal(biddingSessionCookie.domain, new URL(biddingOrigin).hostname, "Bidding session cookie must be host-only");

  await page.getByRole("button", { name: "Book Bidding sign-out" }).click();
  await page.waitForURL((url) => url.origin === biddingTarget.origin && url.pathname === "/auth/login" && url.searchParams.get("manual") === "1", { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
  await page.waitForTimeout(1_000);
  assert.equal(new URL(page.url()).origin, biddingTarget.origin, "local sign-out must not restart Central authorization");
  assert.equal(await page.evaluate(async () => await (await fetch("/api/auth/get-session")).json()), null);

  console.log("Checking Bidding reauthorization");
  await page.goto(biddingTarget.href, { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
  await page.waitForURL((url) => url.origin === biddingTarget.origin && url.pathname === biddingTarget.pathname && url.search === biddingTarget.search, { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
  assert.ok(await page.evaluate(async () => Boolean(await (await fetch("/api/auth/get-session")).json())));

  const readingTarget = new URL(readingDestination, readingOrigin);
  console.log("Checking Reading cross-app SSO");
  const readingCallback = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.origin === readingOrigin && url.pathname === "/api/auth/callback/central-identity";
  }, { timeout: coldStartTimeout });
  await page.goto(readingTarget.href, { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
  const returnToReading = page.waitForEvent("framenavigated", {
    predicate: (frame) => frame === page.mainFrame() && frame.url() === readingTarget.href,
    timeout: coldStartTimeout,
  });
  await readingCallback;
  await returnToReading;
  const readingSessionCookie = (await context.cookies(readingOrigin)).find((cookie) => cookie.name.endsWith("session_token"));
  assert.ok(readingSessionCookie, "Reading must use a session cookie");
  await page.goto(readingTarget.href, { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
  assert.equal(page.url(), readingTarget.href, "Reading must return to the original page");
  const readingSession = await page.evaluate(async () => await (await fetch("/api/auth/get-session")).json());
  assert.ok(readingSession?.session?.id, "Reading must establish an Application Session");
  assert.equal(readingSessionCookie.domain, new URL(readingOrigin).hostname, "Reading session cookie must be host-only");
  assert.notEqual(readingSessionCookie.value, biddingSessionCookie.value, "each app must keep a distinct session cookie");
  assert.notEqual(readingSession.session.id, biddingSession.session.id, "each app must keep a distinct Application Session");
} finally {
  await browser.close();
}
