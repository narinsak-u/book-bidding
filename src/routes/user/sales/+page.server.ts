import { loginPath } from "$lib/server/login-path";
import { db } from "$lib/server/db";
import { redirect } from "@sveltejs/kit";
import { getImage } from "../../helpers";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
    const user = await locals.user;
    if (!user?.id) {
        redirect(302, loginPath(url));
    }

    // get ended auctions
    const now = Date.now();
    const myAuctions = await db.query.books.findMany({
        where: (b, { sql }) => sql`${b.userId} = ${user.id} AND (${b.endDate} < ${new Date(now)} OR ${b.endDate} = ${new Date()})`,
        with: {
            bids: {
                with: { user: true },
            },
            user: true,
        },
        orderBy: (b, { desc }) => [desc(b.createdAt)],
    });

    myAuctions.forEach((b) => {
        b.fileKey = getImage({ filekey: b.fileKey });
    });

    let awaitingPayment: typeof myAuctions = [];
    let pendingPaymentValue = 0;

    // get stats: expenses, salesRevenue
    const myPayments = await db.query.payments.findMany({
        where: (p, { eq }) => eq(p.userId, user.id),
        with: { item: true },
    });

    const expenses = myPayments
        .filter((p) => p.status === "paid")
        .reduce((a, c) => a + ((c.amount / 100) || 0), 0); // convert to major currency

    const sellerPayments = await db.query.payments.findMany({
        with: { item: true },
    });

    const salesRevenue = sellerPayments
        .filter((p) => p.item?.userId === user.id && p.status === "paid")
        .reduce((a, c) => a + ((c.amount / 100) || 0), 0); // convert to major currency

    const paidItemIds = new Set(
        sellerPayments
            .filter((p) => p.item?.userId === user.id && p.status === "paid")
            .map((p) => String(p.itemId))
    );

    awaitingPayment = myAuctions.filter((b) => (b.currentBid || 0) > 0 && !paidItemIds.has(String(b.id)));
    pendingPaymentValue = awaitingPayment.reduce((a, c) => a + (c.currentBid || 0), 0);

    // get purchased items (excluding items that have been sold)
    const purchasedItems = (() => {
        const byId = new Map<string | number, { item: (typeof myPayments[number]['item']); receiptUrl: string | null }>();
        for (const p of myPayments) {
            if (p.status !== "paid" || p.userId !== user.id || !p.item) continue;
            const item = p.item;
            const id = item.id as string | number | undefined;
            if (id == null) continue;
            const existing = byId.get(id);
            const receiptUrl = p.receiptUrl ?? existing?.receiptUrl ?? null;
            byId.set(id, { item, receiptUrl });
        }
        const items = Array.from(byId.values());
        items.forEach((entry) => { if (entry.item?.fileKey) entry.item.fileKey = getImage({ filekey: entry.item.fileKey }); });
        return items;
    })();

    // get sold items
    const soldItems = (() => {
        const seenIds = new Set<string | number>();
        const items = sellerPayments
            .filter((p) => p.item?.userId === user.id && p.status === "paid" && p.item)
            .map((p) => p.item!)
            .filter((item) => {
                const id = item.id as string | number | undefined;
                if (id == null || seenIds.has(id)) return false;
                seenIds.add(id);
                return true;
            });
        items.forEach((i) => { if (i.fileKey) i.fileKey = getImage({ filekey: i.fileKey }); });
        return items;
    })();

    // create stats: pendingPaymentValue, expenses, salesRevenue
    const stats = {
        pendingPaymentValue,
        expenses,
        salesRevenue,
    };

    return { books: myAuctions, awaitingPayment, purchasedItems, soldItems, stats };
};
