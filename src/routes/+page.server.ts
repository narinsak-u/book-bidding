import type { PageServerLoad } from './$types'
import { db } from '$lib/server/db';
import { getImage } from './helpers';

export const prerender = false;

export const load: PageServerLoad = async ({ }) => {

    // get all users
    const users = await db.query.user.findMany();

    // get all transactions
    const transactions = await db.query.payments.findMany();

    // load book auctions
    const books = await db.query.books.findMany({
        with: {
            bids: true,
        }
    });

    // add imageUrl to each book
    books.forEach((book) => {
        book.fileKey = getImage({ filekey: book.fileKey });
    })

    return { books, userCount: users.length, transactionCount: transactions.length }
}