import { chromium } from 'playwright';
import { describe, expect, it } from 'vitest';

const app = import.meta.env.VITE_OIDC_TEST_APP ?? 'https://bidding.127.0.0.1.sslip.io';
const email = import.meta.env.VITE_OIDC_TEST_EMAIL;
const password = import.meta.env.VITE_OIDC_TEST_PASSWORD;

describe.skipIf(!email && !password)('Book Bidding OIDC login over the public browser flow', () => {
	it('returns a central identity to a new ordinary application session', async () => {
		if (!email || !password) throw new Error('Set VITE_OIDC_TEST_EMAIL and VITE_OIDC_TEST_PASSWORD for the live OIDC browser test');

		const browser = await chromium.launch();
		try {
			const page = await browser.newPage({ ignoreHTTPSErrors: true });
			await page.goto(`${app}/auth/login`);
			await page.getByRole('button', { name: /central identity/i }).click();
			await expect.poll(() => page.url()).toContain('auth.127.0.0.1.nip.io');
			await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email);
			await page.getByLabel('Password', { exact: true }).fill(password);
			await page.getByRole('button', { name: 'Sign in', exact: true }).click();
			await expect.poll(() => page.url()).toContain('bidding.127.0.0.1.sslip.io');
			expect(await page.getByRole('heading', { name: /dashboard/i }).isVisible()).toBe(true);
			const localSession = await page.evaluate(async () =>
				fetch('/api/auth/get-session').then((response) => response.json())
			);
			expect(localSession.user.email).toBe(email);
			expect(localSession.session.userId).toBe(localSession.user.id);
		} finally {
			await browser.close();
		}
	});
});
