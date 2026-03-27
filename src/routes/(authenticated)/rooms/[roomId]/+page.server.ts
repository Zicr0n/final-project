import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { room } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, parent, url }) => {
	const { user } = await parent();
	const roomId = Number(params.roomId);

	if (!Number.isInteger(roomId) || isNaN(roomId)) {
		throw error(404, 'Room not found');
	}

	const [found] = await db
		.select({
			id: room.id,
			name: room.name,
			maxPlayers: room.maxPlayers,
			playerCount: room.playerCount
		})
		.from(room)
		.where(eq(room.id, roomId));

	if (!found) {
		throw error(404, 'Room not found');
	}

	return {
		roomId,
		room: found,
		user,
		password: url.searchParams.get('password') ?? ''
	};
};