import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, type Page } from "playwright";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function assertDisabledAuthorization(page: Page, thirdTarget: URL, thirdOrigin: string, identityOrigin: string): Promise<void> {
  const authorizationDenied = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.origin === identityOrigin && url.pathname.endsWith("/oauth2/authorize") && response.status() >= 400;
  }, { timeout: coldStartTimeout });
  await page.goto(thirdTarget.href, { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
  const response = await authorizationDenied;
  assert.equal(response.status(), 401, "Disabled client authorization must return HTTP 401");
  assert.match(await response.text(), /OAuth client is not approved/, "Disabled client must be explicitly rejected");
  await page.goto(new URL("/api/session", thirdOrigin).href, { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
  assert.equal(await page.locator("body").innerText(), "null", "Disabled third RP must not establish a new Application Session");
}
async function waitForDisableResumeFile(path: string): Promise<void> {
  try {
    await access(path);
    throw new Error(`Resume file already exists: ${path}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  console.log(`Disable only the third OIDC client, then create ${path}`);
  const deadline = Date.now() + 15 * 60_000;
  while (Date.now() < deadline) {
    try {
      await access(path);
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    await delay(1_000);
  }
  throw new Error(`Timed out waiting for ${path}`);
}

const biddingOrigin = new URL(required("BIDDING_OIDC_TEST_ORIGIN")).origin;
const readingOrigin = new URL(required("READING_OIDC_TEST_ORIGIN")).origin;
const identityOrigin = new URL(required("CENTRAL_IDENTITY_TEST_ORIGIN")).origin;
const email = required("CENTRAL_IDENTITY_TEST_EMAIL");
const password = required("CENTRAL_IDENTITY_TEST_PASSWORD");
const biddingDestination = process.env.BIDDING_OIDC_TEST_DESTINATION ?? "/dashboard";
const readingDestination = process.env.READING_OIDC_TEST_DESTINATION ?? "/dashboard";
const disableResumeFile = process.env.THIRD_RP_DISABLE_RESUME_FILE;
if (disableResumeFile && process.env.THIRD_RP_EXPECT_DISABLED === "1") {
  throw new Error("Use either THIRD_RP_DISABLE_RESUME_FILE or THIRD_RP_EXPECT_DISABLED, not both");
}
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
  const activeBiddingSession = await page.evaluate(async () => await (await fetch("/api/auth/get-session")).json());

  const readingTarget = new URL(readingDestination, readingOrigin);
  console.log("Checking Reading cross-app SSO");
  const readingCallback = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.origin === readingOrigin && url.pathname === "/api/auth/callback/central-identity";
  }, { timeout: coldStartTimeout });
  await page.goto(readingTarget.href, { waitUntil: "commit", timeout: coldStartTimeout });
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
  const thirdOrigin = process.env.THIRD_RP_TEST_ORIGIN;
  if (thirdOrigin) {
    const thirdTarget = new URL(process.env.THIRD_RP_TEST_DESTINATION ?? "/private?resource=browser-proof", thirdOrigin);
    if (process.env.THIRD_RP_EXPECT_DISABLED === "1") {
      console.log("Checking disabled third RP authorization");
      const disabledPage = await context.newPage();
      try {
        await assertDisabledAuthorization(disabledPage, thirdTarget, thirdOrigin, identityOrigin);
      } finally {
        await disabledPage.close();
      }
    } else {
      console.log("Checking third RP confidential-client SSO");
      await page.goto(thirdTarget.href, { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
      await page.waitForURL((url) => url.origin === thirdTarget.origin && url.pathname === thirdTarget.pathname && url.search === thirdTarget.search, { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
      const thirdSession = await page.evaluate(async () => await (await fetch("/api/session")).json());
      assert.equal(thirdSession?.active, true, "Third RP must establish its own Application Session");
      const thirdCookie = (await context.cookies(thirdOrigin)).find((cookie) => cookie.name === "third_rp_session");
      assert.ok(thirdCookie, "Third RP must use a session cookie");
      assert.equal(thirdCookie.domain, new URL(thirdOrigin).hostname, "Third RP session cookie must be host-only");
      assert.equal(thirdCookie.httpOnly, true, "Third RP session cookie must be HttpOnly");
      assert.equal(thirdCookie.secure, true, "Third RP session cookie must be Secure");
      assert.notEqual(thirdCookie.value, biddingSessionCookie.value, "Third RP must keep a distinct session cookie");
      if (disableResumeFile) {
        await waitForDisableResumeFile(disableResumeFile);
        await page.goto(thirdTarget.href, { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
        assert.equal((await page.evaluate(async () => await (await fetch("/api/session")).json()))?.active, true, "Disabling third RP must preserve its established Application Session");
        await page.goto(biddingTarget.href, { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
        assert.equal((await page.evaluate(async () => await (await fetch("/api/auth/get-session")).json()))?.session?.id, activeBiddingSession.session.id, "Disabling third RP must preserve Bidding Application Session");
        await page.goto(readingTarget.href, { waitUntil: "domcontentloaded", timeout: coldStartTimeout });
        assert.equal((await page.evaluate(async () => await (await fetch("/api/auth/get-session")).json()))?.session?.id, readingSession.session.id, "Disabling third RP must preserve Reading Application Session");

        const freshContext = await browser.newContext();
        try {
          await freshContext.addCookies((await context.cookies()).filter((cookie) =>
            cookie.name !== "third_rp_session" && cookie.name !== "third_rp_state"));
          const freshPage = await freshContext.newPage();
          await assertDisabledAuthorization(freshPage, thirdTarget, thirdOrigin, identityOrigin);
        } finally {
          await freshContext.close();
        }
      }
    }
  } else if (process.env.THIRD_RP_EXPECT_DISABLED === "1" || disableResumeFile) {
    throw new Error("THIRD_RP_EXPECT_DISABLED or THIRD_RP_DISABLE_RESUME_FILE requires THIRD_RP_TEST_ORIGIN");
  }

} finally {
  await browser.close();
}
