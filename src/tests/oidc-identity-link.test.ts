import { chromium } from 'playwright';
import { describe, expect, it } from 'vitest';

const provider = 'https://auth.127.0.0.1.nip.io';
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
				await page.goto(provider);
				await page.evaluate(() => fetch('/api/auth/sign-out', { method: 'POST' }));
				await page.goto(`${app}/auth/login`);
				await page.getByRole('textbox', { name: /email/i }).fill(localEmail);
				await page.getByRole('textbox', { name: /password/i }).fill(localPassword);
				await page.getByRole('button', { name: 'Sign In', exact: true }).click();
				await expect.poll(() => page.url()).toContain('/dashboard');
				const originalSession = await page.evaluate(() =>
					fetch('/api/auth/get-session').then((response) => response.json())
				);
				const originalUserId = originalSession.user.id;

				await page.goto(`${app}/account/identity`);
				await page.getByRole('button', { name: /link central identity/i }).click();
				await expect.poll(() => page.url()).toContain('auth.127.0.0.1.nip.io');
				await page.getByRole('textbox', { name: 'Email', exact: true }).fill(centralEmail);
				await page.getByRole('textbox', { name: 'Password', exact: true }).fill(`${centralPassword}-wrong`);
				await page.getByRole('button', { name: 'Sign in', exact: true }).click();
				await expect.poll(() => page.url()).toContain('auth.127.0.0.1.nip.io');
				await page.goto(`${app}/account/identity`);
				const sessionAfterFailedProof = await page.evaluate(() =>
					fetch('/api/auth/get-session').then((response) => response.json())
				);
				expect(sessionAfterFailedProof.user.id).toBe(originalUserId);

				await page.getByRole('button', { name: /link central identity/i }).click();
				await expect.poll(() => page.url()).toContain('auth.127.0.0.1.nip.io');
				await page.getByRole('textbox', { name: 'Email', exact: true }).fill(centralEmail);
				await page.getByRole('textbox', { name: 'Password', exact: true }).fill(centralPassword);
				await page.getByRole('button', { name: 'Sign in', exact: true }).click();
				await expect.poll(() => page.url()).toContain('/account/identity');
				await expect(page.getByText(/identity linked/i)).toBeVisible();
				const linkedSession = await page.evaluate(() =>
					fetch('/api/auth/get-session').then((response) => response.json())
				);
				expect(linkedSession.user.id).toBe(originalUserId);

				await page.evaluate(() => fetch('/api/auth/sign-out', { method: 'POST' }));
				await page.goto(provider);
				await page.evaluate(() => fetch('/api/auth/sign-out', { method: 'POST' }));
				await page.goto(`${app}/auth/login`);
				await page.getByRole('button', { name: /central identity/i }).click();
				await expect.poll(() => page.url()).toContain('auth.127.0.0.1.nip.io');
				await page.getByRole('textbox', { name: 'Email', exact: true }).fill(centralEmail);
				await page.getByRole('textbox', { name: 'Password', exact: true }).fill(centralPassword);
				await page.getByRole('button', { name: 'Sign in', exact: true }).click();
				await expect.poll(() => page.url()).toContain('/dashboard');
				const signedInSession = await page.evaluate(() =>
					fetch('/api/auth/get-session').then((response) => response.json())
				);
				expect(signedInSession.user.id).toBe(originalUserId);
			} finally {
				await browser.close();
			}
		});
	}
);
