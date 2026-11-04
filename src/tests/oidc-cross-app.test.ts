import { chromium, type Page } from 'playwright';
import { describe, expect, it } from 'vitest';

const bidding = import.meta.env.VITE_OIDC_TEST_APP ?? 'https://bidding.127.0.0.1.sslip.io';
const reading = import.meta.env.VITE_OIDC_TEST_READING_APP ?? 'https://reading.lvh.me';
const email = import.meta.env.VITE_OIDC_TEST_EMAIL;
const password = import.meta.env.VITE_OIDC_TEST_PASSWORD;
function centralSignInForm(page: Page) {
	return page.locator('form').filter({ hasText: /sign in/i });
}

describe.skipIf(!email || !password)('Central Identity across Book Bidding and Read in Peace', () => {
	it('keeps both application sessions independent of each other and Central Identity sign-out', async () => {
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
			const centralForm = centralSignInForm(biddingPage);
			await centralForm.getByLabel(/email/i).fill(email);
			await centralForm.getByLabel(/password/i).fill(password);
			await centralForm.getByRole('button', { name: /sign in/i }).click();
			await biddingPage.waitForURL(new RegExp(`${bidding.replaceAll('.', '\\.')}/dashboard`), { timeout: 20_000 });
			const biddingSession = await biddingPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			);
			expect(biddingSession.user.email).toBe(email);

			const readingPage = await context.newPage();
			const readingReady = readingPage.waitForResponse((response) => response.url().endsWith('/api/auth/get-session'));
			await readingPage.goto(`${reading}/dashboard`);
			await readingReady;
			await readingPage.getByRole('button', { name: 'Sign in', exact: true }).first().click();
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
			const biddingSignedOut = biddingPage.waitForResponse((response) =>
				response.url().endsWith('/api/auth/sign-out') && response.request().method() === 'POST'
			);
			await biddingPage.getByRole('button', { name: 'Book Bidding sign-out' }).click();
			await biddingSignedOut;
			expect(await biddingPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			)).toBeNull();
			expect((await readingPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			)).session.id).toBe(readingSession.session.id);

			const biddingLoginReady = biddingPage.waitForResponse((response) => response.url().endsWith('/api/auth/get-session'));
			await biddingPage.goto(`${bidding}/auth/login`);
			await biddingLoginReady;
			await biddingPage.getByRole('button', { name: /central identity/i }).click();
			await biddingPage.waitForURL(new RegExp(`${bidding.replaceAll('.', '\\.')}/dashboard`), { timeout: 20_000 });
			const restoredBiddingSession = await biddingPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			);
			expect(restoredBiddingSession.user.email).toBe(email);

			const centralPage = await context.newPage();
			await centralPage.goto('https://auth.127.0.0.1.nip.io');
			const centralSignOut = await centralPage.evaluate(async () =>
				fetch('/api/auth/sign-out', { method: 'POST' }).then((response) => response.ok)
			);
			expect(centralSignOut).toBe(true);
			expect(await centralPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			)).toBeNull();
			expect((await biddingPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			)).session.id).toBe(restoredBiddingSession.session.id);
			expect((await readingPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			)).session.id).toBe(readingSession.session.id);

			await readingPage.getByRole('button', { name: 'Open profile menu' }).click();
			const readingSignedOut = readingPage.waitForResponse((response) =>
				response.url().endsWith('/api/auth/sign-out') && response.request().method() === 'POST'
			);
			await readingPage.getByRole('button', { name: 'Sign out of Read in Peace' }).click();
			await readingSignedOut;
			expect(await readingPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			)).toBeNull();
			expect((await biddingPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			)).session.id).toBe(restoredBiddingSession.session.id);

			const biddingSignedOutAfterCentral = biddingPage.waitForResponse((response) =>
				response.url().endsWith('/api/auth/sign-out') && response.request().method() === 'POST'
			);
			await biddingPage.getByRole('button', { name: 'Book Bidding sign-out' }).click();
			await biddingSignedOutAfterCentral;
			expect(await biddingPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			)).toBeNull();

			await biddingPage.getByRole('button', { name: /central identity/i }).click();
			await biddingPage.waitForURL(/auth\.127\.0\.0\.1\.nip\.io/, { timeout: 20_000 });
			await centralForm.getByLabel(/email/i).waitFor({ state: 'visible' });
			await centralForm.getByLabel(/email/i).fill(email);
			await centralForm.getByLabel(/password/i).fill(password);
			await centralForm.getByRole('button', { name: /sign in/i }).click();
			await biddingPage.waitForURL(new RegExp(`${bidding.replaceAll('.', '\\.')}/dashboard`), { timeout: 20_000 });
			const freshBiddingSession = await biddingPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			);
			expect(freshBiddingSession.user.email).toBe(email);
		} finally {
			await browser.close();
		}
	}, 150_000);
	it('restores protected destinations and rejects hostile return targets', async () => {
		const browser = await chromium.launch();
		try {
			const context = await browser.newContext({ ignoreHTTPSErrors: true });
			const page = await context.newPage();
			const identityReady = page.waitForResponse((response) => response.url().endsWith('/api/auth/get-session'));
			await page.goto(`${bidding}/account/identity`);
			await identityReady;
			await page.getByRole('button', { name: /central identity/i }).click();
			await page.waitForURL(/auth\.127\.0\.0\.1\.nip\.io/, { timeout: 20_000 });
			const centralForm = centralSignInForm(page);
			await centralForm.getByLabel(/email/i).fill(email!);
			await centralForm.getByLabel(/password/i).fill(password!);
			await centralForm.getByRole('button', { name: /sign in/i }).click();
			await page.waitForURL(new RegExp(`${bidding.replaceAll('.', '\\.')}/account/identity(?:\\?.*)?$`), { timeout: 20_000 });

			const localSignOut = page.waitForResponse((response) =>
				response.url().endsWith('/api/auth/sign-out') && response.request().method() === 'POST'
			);
			await page.getByRole('button', { name: 'Book Bidding sign-out' }).click();
			await localSignOut;
			expect(await page.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			)).toBeNull();

			const centralPage = await context.newPage();
			await centralPage.goto('https://auth.127.0.0.1.nip.io');
			const centralSignOutButton = centralPage.getByRole('button', { name: 'Sign out of Central Identity' });
			await centralSignOutButton.waitFor({ state: 'visible' });
			const centralSignOut = centralPage.waitForResponse((response) =>
				response.url().endsWith('/api/auth/sign-out') && response.request().method() === 'POST'
			);
			await centralSignOutButton.click();
			await centralSignOut;
			await centralPage.waitForText('Central SSO Session ended');
			expect(await centralPage.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			)).toBeNull();
			await page.goto(`${bidding}/auth/login?next=${encodeURIComponent('https://evil.example/steal')}`);
			await page.getByRole('button', { name: /central identity/i }).click();
			await page.waitForURL(/auth\.127\.0\.0\.1\.nip\.io/, { timeout: 20_000 });
			await centralForm.getByLabel(/email/i).fill(email!);
			await centralForm.getByLabel(/password/i).fill(password!);
			await centralForm.getByRole('button', { name: /sign in/i }).click();
			await page.waitForURL(new RegExp(`${bidding.replaceAll('.', '\\.')}/dashboard(?:\\?.*)?$`), { timeout: 20_000 });
			expect(new URL(page.url()).origin).toBe(new URL(bidding).origin);
			expect(new URL(page.url()).pathname).toBe('/dashboard');
		} finally {
			await browser.close();
		}
	}, 90_000);

});
