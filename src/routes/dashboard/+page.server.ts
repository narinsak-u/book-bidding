import { db } from "$lib/server/db";
import { redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { books } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { BUCKET_NAME } from "./shared/constants";
import { supabase } from "$lib/supabase-client";

export const load: PageServerLoad = async ({ locals, url }) => {

    // get user from locals
    if (!locals.user?.id) {
        redirect(302, `/auth/login?next=${encodeURIComponent(url.pathname + url.search)}`);
    }

    // get user's books
    const books = await db.query.books.findMany({
        where: (books, { eq }) => eq(books.userId, locals.user?.id),
        with: {
            bids: true,
        },
    });

    return { books };
}

export const actions = {
    deleteAuction: async ({ request, locals }) => {
        const formData = await request.formData();
        const auctionId = String(formData.get('auctionId'));
        const userId = locals.user?.id;

        // check user
        if (!userId) {
            redirect(302, '/login');
        }

        if (!auctionId) {
            return {
                error: 'Auction ID is required',
            };
        }

        // check auction
        const auction = await db.query.books.findFirst({
            where: (books, { eq }) => eq(books.id, auctionId),
        });

        if (!auction) {
            return {
                error: 'Auction not found',
            };
        }

        // delete auction and image from supabase storage
        try {
            await db.delete(books).where(eq(books.id, auctionId));
            await supabase.storage.from(BUCKET_NAME).remove([auction.fileKey]);
        } catch (error) {
            return {
                error: 'Failed to delete auction',
            };
        }

        // return success so client enhance sees status 200
        return { success: true };
    }
} satisfies Actions;
