import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';

const app = import.meta.env.VITE_OIDC_TEST_APP ?? 'https://bidding.127.0.0.1.sslip.io';
const provider = 'https://auth.127.0.0.1.nip.io';
const email = import.meta.env.VITE_OIDC_CONFLICT_EMAIL;
const centralPassword = import.meta.env.VITE_OIDC_CONFLICT_PASSWORD;
const localPassword = import.meta.env.VITE_OIDC_LOCAL_PASSWORD;

describe('Book Bidding OIDC email collision protection', () => {
  it('does not link a matching email to an existing application user', async () => {
    if (!email || !centralPassword || !localPassword) {
      throw new Error('Set VITE_OIDC_CONFLICT_EMAIL, VITE_OIDC_CONFLICT_PASSWORD, and VITE_OIDC_LOCAL_PASSWORD for the email-collision browser test');
    }

    await page.goto(app);
    const localUser = await page.evaluate(async ({ email, password }) => {
      const signup = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Existing app user', email, password }),
      });
      if (signup.ok) return signup.json();
      const signin = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!signin.ok) throw new Error('The collision test Application User could not be created or signed in');
      return signin.json();
    }, { email, password: localPassword });
    const originalUserId = localUser.user.id;

    await page.evaluate(() => fetch('/api/auth/sign-out', { method: 'POST' }));
    await page.goto(provider);
    await page.evaluate(() => fetch('/api/auth/sign-out', { method: 'POST' }));
    await page.goto(`${app}/auth/login`);
    await page.getByRole('button', { name: /central identity/i }).click();
    await expect.poll(() => page.url()).toContain('auth.127.0.0.1.nip.io');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(centralPassword);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect.poll(() => new URL(page.url()).origin).toBe(new URL(app).origin);
    const unauthenticated = await page.evaluate(() =>
      fetch('/api/auth/get-session').then((response) => response.json())
    );
    expect(unauthenticated).toBeNull();

    await page.goto(`${app}/auth/login`);
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(localPassword);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect.poll(async () => {
      const session = await page.evaluate(() =>
        fetch('/api/auth/get-session').then((response) => response.json())
      );
      return session?.user?.id;
    }).toBe(originalUserId);
  });
});
