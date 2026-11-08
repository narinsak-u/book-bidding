import { db } from "$lib/server/db";
import { getImage } from "../../helpers";
import { redirect } from "@sveltejs/kit";

export const load = async ({ locals }: { locals: { user: { id: string } | null } }) => {
    const user = await locals.user;

    if (!user?.id) {
        redirect(302, '/auth/login')
    }

    // === BIDS LOAD ===
    const myBids = await db.query.bids.findMany({
        where: (bids, { eq }) => eq(bids.userId, user.id),
        with: { item: true },
        orderBy: (b, { desc }) => [desc(b.createdAt)],
    });

    const seen = new Set<string | number>();
    const uniqueBids: typeof myBids = [];

    for (const b of myBids) {
        const itemId = b.item?.id as string | number | undefined;
        if (itemId == null) continue;

        if (seen.has(itemId)) continue;
        seen.add(itemId);

        if (b.item?.fileKey) {
            b.item.fileKey = getImage({ filekey: b.item.fileKey });
        }
        uniqueBids.push(b);
    }

    const activeBids = uniqueBids.filter(b => b.item?.endDate > new Date());
    let endedBids = uniqueBids.filter(b => b.item?.endDate <= new Date());

    const myPayments = await db.query.payments.findMany({
        where: (p, { eq }) => eq(p.userId, user.id),
        with: { item: true },
    });

    const paidItemIds = new Set(
        myPayments
            .filter((p) => ["paid", "succeeded", "completed"].includes(p.status))
            .map((p) => String(p.itemId))
    );

    endedBids = endedBids.filter((b) => {
        const id = b.item?.id;
        if (id == null) return false;
        return !paidItemIds.has(String(id));
    });

    // === SALES LOAD ===
    const now = Date.now();
    const myAuctions = await db.query.books.findMany({
        where: (b, { sql }) => sql`${b.userId} = ${user.id} AND (${b.endDate} < ${new Date(now)} OR ${b.endDate} = ${new Date()})`,
        with: {
            bids: { with: { user: true } },
            user: true,
        },
        orderBy: (b, { desc }) => [desc(b.createdAt)],
    });

    myAuctions.forEach((b) => {
        b.fileKey = getImage({ filekey: b.fileKey });
    });

    let awaitingPayment: typeof myAuctions = [];
    let pendingPaymentValue = 0;

    const sellerPayments = await db.query.payments.findMany({
        with: { item: true },
    });

    const salesRevenue = sellerPayments
        .filter((p) => p.item?.userId === user.id && p.status === "paid")
        .reduce((a, c) => a + ((c.amount / 100) || 0), 0);

    const paidItemIdsForSeller = new Set(
        sellerPayments
            .filter((p) => p.item?.userId === user.id && p.status === "paid")
            .map((p) => String(p.itemId))
    );

    awaitingPayment = myAuctions.filter((b) => (b.currentBid || 0) > 0 && !paidItemIdsForSeller.has(String(b.id)));
    pendingPaymentValue = awaitingPayment.reduce((a, c) => a + (c.currentBid || 0), 0);

    const purchasedItems = (() => {
        const byId = new Map<string | number, { item: typeof myPayments[number]['item']; receiptUrl: string | null }>();
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

    const stats = {
        pendingPaymentValue,
        expenses: myPayments.filter((p) => p.status === "paid").reduce((a, c) => a + ((c.amount / 100) || 0), 0),
        salesRevenue,
    };

    return {
        activeBids,
        endedBids,
        awaitingPayment,
        purchasedItems,
        soldItems,
        stats,
        user: { id: user.id },
    };
};