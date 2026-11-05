import { chromium } from 'playwright';
import { describe, expect, it } from 'vitest';

const app = import.meta.env.VITE_OIDC_TEST_APP ?? 'https://bidding.127.0.0.1.sslip.io';
const provider = import.meta.env.VITE_OIDC_TEST_CENTRAL_IDENTITY ?? 'https://auth.127.0.0.1.nip.io';
const email = import.meta.env.VITE_OIDC_CONFLICT_EMAIL;
const centralPassword = import.meta.env.VITE_OIDC_CONFLICT_PASSWORD;
const localPassword = import.meta.env.VITE_OIDC_LOCAL_PASSWORD;

describe.skipIf(!email || !centralPassword || !localPassword)('Book Bidding OIDC email collision protection', () => {
	it('does not link a matching email to an existing application user', async () => {
		if (!email || !centralPassword || !localPassword) {
			throw new Error('Set VITE_OIDC_CONFLICT_EMAIL, VITE_OIDC_CONFLICT_PASSWORD, and VITE_OIDC_LOCAL_PASSWORD for the email-collision browser test');
		}

		const browser = await chromium.launch();
		try {
			const page = await browser.newPage({ ignoreHTTPSErrors: true });
			await page.goto(app);
			const localUser = await page.evaluate(async ({ email, password }) => {
				const signup = await fetch('/api/auth/sign-up/email', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ name: 'Existing app user', email, password })
				});
				if (signup.ok) return signup.json();
				const signin = await fetch('/api/auth/sign-in/email', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ email, password })
				});
				if (!signin.ok) throw new Error('The collision test Application User could not be created or signed in');
				return signin.json();
			}, { email, password: localPassword });
			const originalUserId = localUser.user.id;

			await page.evaluate(() => fetch('/api/auth/sign-out', { method: 'POST' }));
			await page.goto(`${provider}/sign-in`);
			await page.evaluate(() => fetch('/api/auth/sign-out', { method: 'POST' }));
			const ready = page.waitForResponse((response) => response.url().endsWith('/api/auth/get-session'));
			await page.goto(`${app}/auth/login`);
			await ready;
			await page.getByRole('button', { name: /central identity/i }).click();
			await page.waitForURL(/auth\.127\.0\.0\.1\.nip\.io/, { timeout: 20_000 });
			await page.getByLabel('Email address').fill(email);
			await page.getByLabel('Password').fill(centralPassword);
			await page.getByRole('button', { name: 'Sign in', exact: true }).click();
			await expect.poll(() => new URL(page.url()).origin).toBe(new URL(app).origin);
			const unauthenticated = await page.evaluate(() =>
				fetch('/api/auth/get-session').then((response) => response.json())
			);
			expect(unauthenticated).toBeNull();

			const localReady = page.waitForResponse((response) => response.url().endsWith('/api/auth/get-session'));
			await page.goto(`${app}/auth/login`);
			await localReady;
			await page.getByRole('textbox', { name: /email/i }).fill(email);
			await page.getByRole('textbox', { name: /password/i }).fill(localPassword);
			await page.getByRole('button', { name: 'Sign In', exact: true }).click();
			await expect.poll(async () => {
				const session = await page.evaluate(() =>
					fetch('/api/auth/get-session').then((response) => response.json())
				);
				return session?.user?.id;
			}, { timeout: 20_000 }).toBe(originalUserId);
		} finally {
			await browser.close();
		}
	}, 120_000);
});
