import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { room,character } from '$lib/server/db/schema';
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
			playerCount: room.playerCount,
			type : room.type
		})
		.from(room)
		.where(eq(room.id, roomId));

	if (!found) {
		throw error(404, 'Room not found');
	}

	const [char] = await db
		.select({
			id: character.id,
			userId : character.userId,
			hatId: character.hatId,
			shirtId: character.shirtId,
			eyesId: character.eyesId,
			bodyColor: character.bodyColor
		})
		.from(character)
		.where(eq(character.userId, user.id));

	if (!char) {
		throw error(404, 'Character not found');
	}

	return {
		roomId,
		room: found,
		user,
		char,
		password: url.searchParams.get('password') ?? ''
	};
};