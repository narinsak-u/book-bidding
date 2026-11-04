import { loginPath } from '$lib/server/login-path';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.session || !locals.user) redirect(303, loginPath(url));
	return {
		linkError: url.searchParams.get('error') !== null
	};
};
