export const loginPath = (url: URL) =>
	`/auth/login?next=${encodeURIComponent(url.pathname + url.search)}`;
