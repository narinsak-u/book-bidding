import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { getImage } from "../../helpers";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ locals, url }) => {
    const user = await locals.user;

    if (!user?.id) {
        redirect(302, `/auth/login?next=${encodeURIComponent(url.pathname + url.search)}`)
    }

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

    // seperate uniqueBids into two arrays:
    // 1. bids that are still active
    // 2. bids that are ended
    const activeBids = uniqueBids.filter(b => b.item?.endDate > new Date());
    let endedBids = uniqueBids.filter(b => b.item?.endDate <= new Date());

    const myPayments = await db.query.payments.findMany({
        where: (p, { eq }) => eq(p.userId, user.id),
    });

    const paidItemIds = new Set(
        myPayments
            .filter((p) => ["paid", "succeeded", "completed"].includes(p.status))
            .map((p) => String(p.itemId))
    );

    // exclude endedBids that have been paid
    endedBids = endedBids.filter((b) => {
        const id = b.item?.id;
        if (id == null) return false;

        return !paidItemIds.has(String(id));
    });

    return { activeBids, endedBids };
};
