import { loginPath } from "$lib/server/login-path";
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { books } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/auth';
import { deleteFile, uploadFile } from '../../shared/helpers';
import { getImage } from '../../../helpers';

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const userId = locals.user?.id;
  if (!userId) {
    redirect(302, loginPath(url));
  }

  const auctionId = params.auctionId;
  if (!auctionId) {
    throw redirect(302, '/dashboard');
  }

  const book = await db.query.books.findFirst({
    where: (b, { eq }) => eq(b.id, auctionId),
  });

  if (!book || book.userId !== userId) {
    throw redirect(302, '/dashboard');
  }

  // get image from db
  book.fileKey = getImage({ filekey: book.fileKey });

  return { book };
};

export const actions = {
  updateAuction: async (event) => {
    // Ensure user is authenticated
    const session = await auth.api.getSession({ headers: event.request.headers });
    const userId = session?.session?.userId;
    if (!userId) {
      return fail(401, { message: 'Unauthorized' });
    }

    const form = await event.request.formData();
    const auctionId = String(form.get('auctionId') || '').trim();
    const title = String(form.get('title') || '').trim();
    const author = String(form.get('author') || '').trim();
    const description = String(form.get('description') || '').trim();
    const startingPrice = Number(form.get('startingPrice') || 0);
    const condition = String(form.get('condition') || '').trim();
    const pages = Number(form.get('pages') || 0);
    const yearPublished = Number(form.get('yearPublished') || 0);
    const endDateMs = String(form.get('endDate') || '').trim();
    const file = form.get('file') as File | null;

    if (!auctionId) {
      return fail(400, { message: 'Missing auctionId' });
    }

    // Basic validation
    if (!title || !author || !condition) {
      return fail(400, { message: 'Missing required fields' });
    }
    if (startingPrice <= 0 || pages <= 0 || yearPublished <= 0 || !endDateMs) {
      return fail(400, { message: 'Invalid numeric fields or end date' });
    }

    // Fetch existing auction
    const existing = await db.query.books.findFirst({
      where: (b, { eq }) => eq(b.id, auctionId),
    });

    if (!existing || existing.userId !== userId) {
      return fail(404, { message: 'Auction not found' });
    }

    let fileKey = existing.fileKey;

    if (file && (file as File).size > 0) {
      const { fileKey: newKey, err } = await uploadFile({
        file: file as File,
        filekey: (file as File).name,
        userId,
      });

      if (!newKey || err) {
        return fail(500, { message: 'Failed to upload file' });
      }

      fileKey = newKey;

      // Delete old file if it exists
      if (existing.fileKey) {
        await deleteFile(existing.fileKey);
      }
    }

    // Update book
    try {
      await db
        .update(books)
        .set({
          name: title,
          author,
          description,
          startingPrice,
          currentBid: existing.currentBid, // keep consistent for now
          condition,
          pages,
          yearPublished,
          endDate: new Date(endDateMs),
          fileKey,
          updatedAt: new Date(),
        })
        .where(eq(books.id, auctionId));
    } catch (e) {
      console.error('Failed to update auction:', e);
      return fail(500, { message: 'Failed to update auction' });
    }

    // Redirect back to dashboard after update
    throw redirect(303, '/dashboard');
  },
} satisfies Actions;