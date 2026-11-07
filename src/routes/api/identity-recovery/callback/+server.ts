import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { dev } from "$app/environment";
import { PUBLIC_BASE_URL } from "$env/static/public";
import { getAuthRuntimeSettings } from "$lib/server/auth-runtime-settings";
import { finishRecovery } from "$lib/server/identity-recovery";
import { signRecoveryCompletion } from "$lib/server/recovery-completion";

const recoveryCookie = "bidding_identity_recovery";
const completionCookie = "bidding_identity_recovery_complete";
const cookiePath = "/api/identity-recovery";

export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		await finishRecovery(url, cookies.get(recoveryCookie));
	} catch (error) {
		cookies.delete(recoveryCookie, { path: cookiePath });
		if (error instanceof Error && error.message === "IDENTITY_LINK_CONFLICT") {
			return json({ error: "Recovery stopped because this Central Identity or Application User is already linked." }, { status: 409 });
		}
		return json({ error: "Recovery could not verify both accounts. No Identity Link was added." }, { status: 400 });
	}
	cookies.delete(recoveryCookie, { path: cookiePath });
	cookies.set(completionCookie, signRecoveryCompletion(getAuthRuntimeSettings(!dev, PUBLIC_BASE_URL).sessionSecret), {
		path: "/account/identity/recovery",
		httpOnly: true,
		secure: url.protocol === "https:",
		sameSite: "lax",
		maxAge: 60,
	});
	redirect(303, "/account/identity/recovery");
};
