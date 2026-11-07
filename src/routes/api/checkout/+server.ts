import { stripe } from '$lib/stripe';
import { PUBLIC_FRONTEND_URL } from '$env/static/public';
import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
    const baseUrl = dev ? 'http://localhost:5173' : PUBLIC_FRONTEND_URL;

    const { amount, currency = 'usd', name, mode = 'payment', metadata } = await request.json();
    const unitAmount = Math.max(0, Math.round(Number(amount) * 100));

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency,
                    product_data: (metadata && typeof metadata.image === 'string' && metadata.image)
                        ? { name, images: [metadata.image] }
                        : { name },
                    unit_amount: unitAmount,
                },
                quantity: 1,
            },
        ],
        mode,
        invoice_creation: { enabled: true },
        customer_creation: 'always',
        success_url: `${baseUrl}/checkout/success`,
        cancel_url: `${baseUrl}/checkout/failure`,
        metadata,
    });

    // console.log(session, 'session');

    // return json({ sessionId: session.id });
    if (!session.url) {
        throw new Error('No checkout URL returned from Stripe');
    }

    // redirect(303, session.url as string);
    return json({ sessionId: session.id, url: session.url });
}
