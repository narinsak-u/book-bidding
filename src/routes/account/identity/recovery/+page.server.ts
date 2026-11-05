import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.session) redirect(303, "/account/identity");
	return { complete: url.searchParams.get("complete") === "1" };
};
