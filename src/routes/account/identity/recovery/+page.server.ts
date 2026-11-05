import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { dev } from "$app/environment";
import { PUBLIC_BASE_URL } from "$env/static/public";
import { getAuthRuntimeSettings } from "$lib/server/auth-runtime-settings";
import { verifyRecoveryCompletion } from "$lib/server/recovery-completion";

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (locals.session) redirect(303, "/account/identity");
	const completion = cookies.get("bidding_identity_recovery_complete");
	cookies.delete("bidding_identity_recovery_complete", { path: "/account/identity/recovery" });
	return {
		complete: verifyRecoveryCompletion(
			completion,
			getAuthRuntimeSettings(!dev, PUBLIC_BASE_URL).sessionSecret,
		),
	};
};
