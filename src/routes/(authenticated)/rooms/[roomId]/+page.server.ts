import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
// Room validation is now handled server-side via Socket.IO (room_error event).
// We just pass the roomId through to the page.
export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();
	return { roomId: params.roomId, user: user };
};
