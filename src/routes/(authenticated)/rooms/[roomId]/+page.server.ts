// src/routes/(authenticated)/rooms/[roomId]/+page.server.ts
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { room } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const roomId = Number(params.roomId);

	if (!Number.isInteger(roomId) || isNaN(roomId)) {
		error(404, 'Room not found');
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
		error(404, 'Room not found');
	}

	return { roomId, room: found };
};