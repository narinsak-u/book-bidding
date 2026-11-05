import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { finishRecovery } from "$lib/server/identity-recovery";

const recoveryCookie = "bidding_identity_recovery";
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
	redirect(303, "/account/identity/recovery?complete=1");
};
