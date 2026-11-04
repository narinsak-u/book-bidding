import { chromium } from 'playwright';
import { describe, expect, it } from 'vitest';

const bidding = import.meta.env.VITE_OIDC_TEST_APP ?? 'https://bidding.127.0.0.1.sslip.io';
const reading = import.meta.env.VITE_OIDC_TEST_READING_APP ?? 'https://reading.lvh.me';
const email = import.meta.env.VITE_OIDC_TEST_EMAIL;
const password = import.meta.env.VITE_OIDC_TEST_PASSWORD;

describe.skipIf(!email || !password)('Central Identity across Book Bidding and Read in Peace', () => {
	it('creates independent app sessions and keeps Bidding signed in after Reading sign-out', async () => {
		if (!email || !password) {
			throw new Error('Set VITE_OIDC_TEST_EMAIL and VITE_OIDC_TEST_PASSWORD for the live cross-app browser test');
		}

		const browser = await chromium.launch();
		try {
			const context = await browser.newContext({ ignoreHTTPSErrors: true });
			const biddingPage = await context.newPage();
			const biddingReady = biddingPage.waitForResponse((response) => response.url().endsWith('/api/auth/get-session'));
			await biddingPage.goto(`${bidding}/auth/login`);
			await biddingReady;
			await biddingPage.getByRole('button', { name: /central identity/i }).click();
			await biddingPage.waitForURL(/auth\.127\.0\.0\.1\.nip\.io/, { timeout: 20_000 });
			await biddingPage.locator('#signin-email').fill(email);
			await biddingPage.locator('#signin-password').fill(password);
			await biddingPage.locator('#signin button').click();
			await biddingPage.waitForURL(new RegExp(`${bidding.replaceAll('.', '\\.')}/dashboard`), { timeout: 20_000 });
			const biddingSession = await biddingPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			);
			expect(biddingSession.user.email).toBe(email);

			const readingPage = await context.newPage();
			const readingReady = readingPage.waitForResponse((response) => response.url().endsWith('/api/auth/get-session'));
			await readingPage.goto(`${reading}/dashboard`);
			await readingReady;
			await readingPage.getByRole('button', { name: 'Sign in' }).click();
			await readingPage.getByRole('dialog').getByRole('button', { name: 'Continue with Central Identity' }).click();
			await readingPage.waitForURL(new RegExp(`${reading.replaceAll('.', '\\.')}/?$`), { timeout: 20_000 });
			const readingSession = await readingPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			);
			expect(readingSession.user.email).toBe(email);
			expect(readingSession.session.id).not.toBe(biddingSession.session.id);
			expect(readingSession.user.id).not.toBe(biddingSession.user.id);
			const readingDashboardReady = readingPage.waitForResponse((response) => response.url().endsWith('/api/auth/get-session'));
			await readingPage.goto(`${reading}/dashboard`);
			await readingDashboardReady;


			await readingPage.getByRole('button', { name: 'Open profile menu' }).click();
			const signedOut = readingPage.waitForResponse((response) =>
				response.url().endsWith('/api/auth/sign-out') && response.request().method() === 'POST'
			);
			await readingPage.getByRole('button', { name: 'Sign out of Read in Peace' }).click();
			await signedOut;
			const readingAfterSignOut = await readingPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			);
			expect(readingAfterSignOut).toBeNull();
			const biddingAfterReadingSignOut = await biddingPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			);
			expect(biddingAfterReadingSignOut.session.id).toBe(biddingSession.session.id);
		} finally {
			await browser.close();
		}
	}, 90_000);
});
