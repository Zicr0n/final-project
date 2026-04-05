import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { room } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const rooms = await db
		.select({   
			roomId: room.id,
			name: room.name,
			playerCount: room.playerCount,
			maxPlayers: room.maxPlayers,
			ownerId : room.ownerId
		})
		.from(room)
		.orderBy(desc(room.createdAt));

	return { rooms };
};