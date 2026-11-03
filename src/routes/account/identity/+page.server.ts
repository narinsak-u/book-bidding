import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.session || !locals.user) redirect(303, '/auth/login?next=/account/identity');
	return {
		linked: url.searchParams.get('linked') === '1',
		linkError: url.searchParams.get('error') !== null
	};
};
