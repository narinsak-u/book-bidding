import { auth } from "$lib/auth"; // path to your auth file
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
    // Fetch current session from Better Auth
    const session = await auth.api.getSession({
        headers: event.request.headers,
    });
    // Make session and user available on server
    if (session) {
        event.locals.session = session.session;
        event.locals.user = session.user;
    }
    // Caddy terminates TLS; Vite sees HTTP while Better Auth's public origin is HTTPS.
    return event.url.pathname.startsWith('/api/auth/') ? auth.handler(event.request) : resolve(event);
}