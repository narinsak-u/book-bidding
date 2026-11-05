import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const dashboard = '/dashboard';

export const load: PageServerLoad = async ({ locals, url }) => {
    let callbackURL = dashboard;
    const next = url.searchParams.get('next');

    if (next) {
        try {
            const target = new URL(next, url.origin);
            const decodedPath = decodeURIComponent(target.pathname);
            if (
                next.startsWith('/') &&
                !next.startsWith('//') &&
                !next.includes('\\') &&
                !/[\u0000-\u001f\u007f]/.test(next) &&
                target.origin === url.origin &&
                target.pathname !== '/auth/login' &&
                !target.pathname.startsWith('/api/') &&
                !decodedPath.startsWith('//') &&
                !decodedPath.includes('\\') &&
                !/[\u0000-\u001f\u007f]/.test(decodedPath)
            ) {
                callbackURL = `${target.pathname}${target.search}${target.hash}`;
            }
        } catch {
            // Malformed return targets keep the safe dashboard default.
        }
    }

    if (locals.session) redirect(302, callbackURL);
    return { callbackURL, error: url.searchParams.has("error") };
};