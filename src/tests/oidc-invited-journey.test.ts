import { chromium } from 'playwright';
import { describe, expect, it } from 'vitest';

const bidding = import.meta.env.VITE_OIDC_TEST_APP ?? 'https://bidding.127.0.0.1.sslip.io';
const reading = import.meta.env.VITE_OIDC_TEST_READING_APP ?? 'https://reading.lvh.me';
const provider = import.meta.env.VITE_OIDC_TEST_CENTRAL_IDENTITY ?? 'https://auth.127.0.0.1.nip.io';
const mailpit = import.meta.env.VITE_OIDC_TEST_MAILPIT ?? 'http://localhost:8025';
const email = import.meta.env.VITE_OIDC_INVITED_EMAIL;
const password = import.meta.env.VITE_OIDC_INVITED_PASSWORD;
const name = import.meta.env.VITE_OIDC_INVITED_NAME ?? 'Invited Browser User';

async function mailLink(subject: string) {
	const deadline = Date.now() + 20_000;
	while (Date.now() < deadline) {
		const search = await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
		if (search.ok) {
			const result = await search.json() as { messages?: Array<{ ID: string; Subject: string }> };
			for (const message of result.messages ?? []) {
				if (message.Subject !== subject) continue;
				const response = await fetch(`${mailpit}/api/v1/message/${message.ID}`);
				const data = await response.json() as { Text?: string; HTML?: string };
				const match = `${data.Text ?? ''}\n${data.HTML ?? ''}`.match(/https?:\/\/[^\s<>"']+/);
				if (match) return match[0].replaceAll('&amp;', '&');
			}
		}
		// SMTP delivery is asynchronous; Mailpit exposes no readiness signal per message.
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
	throw new Error(`Mailpit did not receive ${subject} for the invited test identity`);
}

describe.skipIf(!email || !password)('Invited Central Identity public HTTPS journey', () => {
	it('enrolls from Mailpit, verifies email, and returns through both relying parties without a second password prompt', async () => {
		if (!email || !password) throw new Error('Set VITE_OIDC_INVITED_EMAIL and VITE_OIDC_INVITED_PASSWORD for the live invited journey');

		const browser = await chromium.launch();
		try {
			const context = await browser.newContext({ ignoreHTTPSErrors: true });
			const page = await context.newPage();
			const invitation = await mailLink('Your Central Identity invitation');
			await page.goto(invitation);
			await page.getByLabel('Name').fill(name);
			await page.getByLabel('Email address').fill(email);
			await page.getByLabel('Password').fill(password);
			await page.getByRole('button', { name: 'Create identity' }).click();
			await page.getByRole('status').getByText(/verification message has been sent/i).waitFor();

			const verification = await mailLink('Verify your Central Identity email');
			await page.goto(verification);
			await page.waitForURL((url) => url.pathname === '/sign-in' && url.searchParams.has('verified'));
			await page.getByText('Email verified. You can now sign in.').waitFor();

			const protectedPath = '/account/identity';
			await page.goto(`${bidding}${protectedPath}`);
			await page.waitForURL((url) => url.pathname === '/auth/login' && url.searchParams.get('next') === protectedPath);
			await page.getByRole('button', { name: /central identity/i }).click();
			await page.waitForURL((url) => url.origin === new URL(provider).origin, { timeout: 20_000 });
			await page.getByLabel('Email address').fill(email);
			await page.getByLabel('Password').fill(password);
			await page.getByRole('button', { name: 'Sign in', exact: true }).click();
			await page.waitForURL((url) => url.origin === new URL(bidding).origin && url.pathname === protectedPath, { timeout: 20_000 });
			const biddingSession = await page.evaluate(() => fetch('/api/auth/get-session').then((response) => response.json()));
			expect(biddingSession.user.email).toBe(email);
			const legacyPage = await context.newPage();
			await legacyPage.goto(bidding);
			const collisionEmail = email.replace('@', '-legacy@');
			const legacyPassword = `${password}-legacy`;
			const legacyUser = await legacyPage.evaluate(async ({ email, password }) => {
				const response = await fetch('/api/auth/sign-up/email', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ name: 'Legacy Bidding user', email, password })
				});
				if (!response.ok) throw new Error('Could not create the disposable legacy Application User');
				return response.json();
			}, { email: collisionEmail, password: legacyPassword });
			const legacyUserId = legacyUser.user.id;
			const accountsReady = legacyPage.waitForResponse((response) => response.url().endsWith('/api/auth/list-accounts'));
			await legacyPage.goto(`${bidding}/account/identity`);
			await accountsReady;
			await legacyPage.getByRole('button', { name: /link central identity/i }).click();
			await legacyPage.waitForURL((url) => url.origin === new URL(bidding).origin && url.pathname === '/account/identity' && url.searchParams.has('error'), { timeout: 20_000 });
			await legacyPage.getByRole('alert').getByText(/already linked/i).waitFor();
			const unchangedLegacySession = await legacyPage.evaluate(() => fetch('/api/auth/get-session').then((response) => response.json()));
			expect(unchangedLegacySession.user.id).toBe(legacyUserId);
			expect(unchangedLegacySession.user.email).toBe(collisionEmail);

			await page.bringToFront();

			const readingPage = await context.newPage();
			const readingPath = '/dashboard';
			let centralPasswordPromptShown = false;
			readingPage.on('framenavigated', (frame) => {
				const url = new URL(frame.url());
				if (frame === readingPage.mainFrame() && url.origin === new URL(provider).origin && url.pathname === '/sign-in') {
					centralPasswordPromptShown = true;
				}
			});
			await readingPage.goto(`${reading}${readingPath}`, { waitUntil: 'domcontentloaded' });
			await readingPage.getByRole('heading', { name: 'Sign in to see your library' }).locator('..').getByRole('button', { name: 'Sign in' }).click();
			await readingPage.getByRole('dialog').getByRole('button', { name: 'Continue with Central Identity' }).click();
			await readingPage.getByRole('button', { name: 'Open profile menu' }).waitFor({ state: 'visible', timeout: 20_000 });
			expect(new URL(readingPage.url()).origin).toBe(new URL(reading).origin);
			expect(new URL(readingPage.url()).pathname).toBe(readingPath);
			expect(await readingPage.getByRole('heading', { name: 'Sign in to see your library' }).count()).toBe(0);
			expect(centralPasswordPromptShown).toBe(false);
			const readingSession = await readingPage.evaluate(() => fetch('/api/auth/get-session').then((response) => response.json()));
			expect(readingSession.user.email).toBe(email);
			expect(readingSession.session.id).not.toBe(biddingSession.session.id);
			expect(readingSession.user.id).not.toBe(biddingSession.user.id);
		} finally {
			await browser.close();
		}
	}, 120_000);
});
