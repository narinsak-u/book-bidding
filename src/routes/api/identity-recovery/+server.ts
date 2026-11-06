import { json, redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { beginRecovery } from "$lib/server/identity-recovery";

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
	const email = form.get("email");
	const password = form.get("password");
	if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
		return json({ error: "Enter the existing Application User email and password." }, { status: 400 });
	}

	let authorizationURL: URL;
	let challenge: string;
	try {
		({ authorizationURL, challenge } = await beginRecovery(email, password));
	} catch (error) {
		if (error instanceof Error && error.message === "RECOVERY_PROOF_INVALID") {
			return json({ error: "Recovery could not verify the existing Application User." }, { status: 401 });
		}
		return json({ error: "Recovery could not start. Contact the operator." }, { status: 503 });
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
