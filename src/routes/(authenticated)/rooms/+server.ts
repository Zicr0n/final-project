// src/routes/(authenticated)/rooms/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { room } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	const rooms = await db
		.select({
			roomId: room.id,
			name: room.name,
			playerCount: room.playerCount,
			maxPlayers: room.maxPlayers
		})
		.from(room)
		.orderBy(desc(room.createdAt));

	return json(rooms);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const name = typeof body.name === 'string' ? body.name.trim() : '';
	const maxPlayers = Number(body.maxPlayers);

	if (!name) {
		return json({ error: 'Room name cannot be empty.' }, { status: 400 });
	}
	if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 50) {
		return json({ error: 'Max players must be between 1 and 50.' }, { status: 400 });
	}

	const [created] = await db
		.insert(room)
		.values({ name, maxPlayers })
		.returning({ roomId: room.id });

	return json({ roomId: created.roomId }, { status: 201 });
};