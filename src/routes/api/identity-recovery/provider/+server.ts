import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { beginProviderRecovery } from "$lib/server/identity-recovery";

const recoveryCookie = "bidding_identity_recovery";
const cookiePath = "/api/identity-recovery";

export const POST: RequestHandler = async ({ request, url, cookies, locals }) => {
	if (locals.session) redirect(303, "/account/identity");
	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return json({ error: "Recovery request was not accepted." }, { status: 400 });
	}
	const provider = form.get("provider");
	if (provider !== "google" && provider !== "github") return json({ error: "Choose the provider already linked to this Application User." }, { status: 400 });

	let authorizationURL: URL;
	let challenge: string;
	try {
		({ authorizationURL, challenge } = await beginProviderRecovery(provider));
	} catch {
		return json({ error: "Recovery provider could not be started. Contact the operator." }, { status: 503 });
	}
	cookies.set(recoveryCookie, challenge, {
		path: cookiePath,
		httpOnly: true,
		sameSite: "lax",
		secure: url.protocol === "https:",
		maxAge: 600,
	});
	redirect(303, authorizationURL.toString());
};
