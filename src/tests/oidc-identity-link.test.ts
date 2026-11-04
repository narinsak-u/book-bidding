import { chromium } from 'playwright';
import { describe, expect, it } from 'vitest';

const provider = 'https://auth.127.0.0.1.nip.io';
const app = 'https://bidding.127.0.0.1.sslip.io';
const localEmail = import.meta.env.VITE_OIDC_LINK_LOCAL_EMAIL;
const localPassword = import.meta.env.VITE_OIDC_LINK_LOCAL_PASSWORD;
const centralEmail = import.meta.env.VITE_OIDC_LINK_CENTRAL_EMAIL;
const centralPassword = import.meta.env.VITE_OIDC_LINK_CENTRAL_PASSWORD;

describe.skipIf(!localEmail || !localPassword || !centralEmail || !centralPassword)(
	'Book Bidding explicit Central Identity linking over the public browser flow',
	() => {
		it('links the authenticated Application User and reuses it on later central sign-in', async () => {
			if (!localEmail || !localPassword || !centralEmail || !centralPassword) {
				throw new Error('Set VITE_OIDC_LINK_LOCAL_EMAIL, VITE_OIDC_LINK_LOCAL_PASSWORD, VITE_OIDC_LINK_CENTRAL_EMAIL, and VITE_OIDC_LINK_CENTRAL_PASSWORD for the live identity-link browser test');
			}

			const browser = await chromium.launch();
			try {
				const page = await browser.newPage({ ignoreHTTPSErrors: true });
				await page.goto(`${provider}/sign-in`);
				await page.evaluate(() => fetch('/api/auth/sign-out', { method: 'POST' }));
				const ready = page.waitForResponse((response) => response.url().endsWith('/api/auth/get-session'));
				await page.goto(`${app}/auth/login`);
				await ready;
				await page.getByRole('textbox', { name: /email/i }).fill(localEmail);
				await page.getByLabel('Password').fill(localPassword);
				await page.getByRole('button', { name: 'Sign In', exact: true }).click();
				await page.waitForURL(app + '/', { timeout: 20_000 });
				const originalSession = await page.evaluate(() =>
					fetch('/api/auth/get-session').then((response) => response.json())
				);
				const originalUserId = originalSession.user.id;

				const accountsReady = page.waitForResponse((response) => response.url().endsWith('/api/auth/list-accounts'));
				await page.goto(`${app}/account/identity`);
				await accountsReady;
				await page.getByRole('button', { name: /link central identity/i }).click();
				await page.waitForURL(/auth\.127\.0\.0\.1\.nip\.io/, { timeout: 20_000 });
				await page.getByLabel('Email address').fill(centralEmail);
				await page.getByLabel('Password').fill(`${centralPassword}-wrong`);
				await page.getByRole('button', { name: 'Sign in', exact: true }).click();
				await page.getByRole('alert').getByText(/did not match/i).waitFor();
				const retryReady = page.waitForResponse((response) => response.url().endsWith('/api/auth/list-accounts'));
				await page.goto(`${app}/account/identity`);
				await retryReady;
				const sessionAfterFailedProof = await page.evaluate(() =>
					fetch('/api/auth/get-session').then((response) => response.json())
				);
				expect(sessionAfterFailedProof.user.id).toBe(originalUserId);

				await page.getByRole('button', { name: /link central identity/i }).click();
				await page.waitForURL(/auth\.127\.0\.0\.1\.nip\.io/, { timeout: 20_000 });
				await page.getByLabel('Email address').fill(centralEmail);
				await page.getByLabel('Password').fill(centralPassword);
				await page.getByRole('button', { name: 'Sign in', exact: true }).click();
				await page.waitForURL(/\/account\/identity/, { timeout: 20_000 });
				await page.getByText(/identity linked/i).waitFor();
				const linkedSession = await page.evaluate(() =>
					fetch('/api/auth/get-session').then((response) => response.json())
				);
				expect(linkedSession.user.id).toBe(originalUserId);

				await page.evaluate(() => fetch('/api/auth/sign-out', { method: 'POST' }));
				await page.goto(`${provider}/sign-in`);
				await page.evaluate(() => fetch('/api/auth/sign-out', { method: 'POST' }));
				const signedOutReady = page.waitForResponse((response) => response.url().endsWith('/api/auth/get-session'));
				await page.goto(`${app}/auth/login`);
				await signedOutReady;
				await page.getByRole('button', { name: /central identity/i }).click();
				await page.waitForURL(/auth\.127\.0\.0\.1\.nip\.io/, { timeout: 20_000 });
				await page.getByLabel('Email address').fill(centralEmail);
				await page.getByLabel('Password').fill(centralPassword);
				await page.getByRole('button', { name: 'Sign in', exact: true }).click();
				await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
				const signedInSession = await page.evaluate(() =>
					fetch('/api/auth/get-session').then((response) => response.json())
				);
				expect(signedInSession.user.id).toBe(originalUserId);
			} finally {
				await browser.close();
			}
		}, 120_000);
	}
);
