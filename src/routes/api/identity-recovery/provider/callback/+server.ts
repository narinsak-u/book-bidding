import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { finishProviderRecovery } from "$lib/server/identity-recovery";

const recoveryCookie = "bidding_identity_recovery";
const cookiePath = "/api/identity-recovery";

export const GET: RequestHandler = async ({ url, cookies }) => {
	let authorizationURL: URL;
	try {
		({ authorizationURL } = await finishProviderRecovery(url, cookies.get(recoveryCookie)));
	} catch {
		cookies.delete(recoveryCookie, { path: cookiePath });
		return json({ error: "Recovery could not verify an existing provider link. No Identity Link was added." }, { status: 400 });
	}
	redirect(303, authorizationURL.toString());
};
