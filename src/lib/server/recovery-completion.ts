import { createHmac, timingSafeEqual } from "node:crypto";

const completionLifetimeMs = 60_000;

export function signRecoveryCompletion(secret: string | undefined, now = Date.now()): string {
	if (!secret) throw new Error("Recovery completion signing is not configured.");
	const issuedAt = String(now);
	return `${issuedAt}.${createHmac("sha256", secret).update(issuedAt).digest("hex")}`;
}

export function verifyRecoveryCompletion(
	token: string | undefined,
	secret: string | undefined,
	now = Date.now(),
): boolean {
	if (!token || !secret) return false;
	const [issuedAt, signature, extra] = token.split(".");
	const timestamp = Number(issuedAt);
	if (extra !== undefined || !Number.isSafeInteger(timestamp) || timestamp > now || now - timestamp > completionLifetimeMs) return false;
	const expected = createHmac("sha256", secret).update(issuedAt).digest();
	const supplied = Buffer.from(signature ?? "", "hex");
	return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
