// src/routes/(authenticated)/rooms/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { room } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import argon2 from 'argon2';

export const GET: RequestHandler = async () => {
	const rooms = await db
		.select({
			roomId: room.id,
			name: room.name,
			playerCount: room.playerCount,
			maxPlayers: room.maxPlayers,
			isPrivate: room.isPrivate
		})
		.from(room)
		.orderBy(desc(room.createdAt));

	return json(rooms);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json();
	const name = typeof body.name === 'string' ? body.name.trim() : '';
	const maxPlayers = Number(body.maxPlayers);
	const password = typeof body.password === 'string' ? body.password.trim() : '';

	if (!name) {
		return json({ error: 'Room name cannot be empty.' }, { status: 400 });
	}

	if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 50) {
		return json({ error: 'Max players must be between 1 and 50.' }, { status: 400 });
	}

	if (password.length > 100) {
		return json({ error: 'Password is too long.' }, { status: 400 });
	}

	const isPrivate = password.length > 0;
	const passwordHash = isPrivate ? await argon2.hash(password) : null;

	const [created] = await db
		.insert(room)
		.values({
			name,
			maxPlayers,
			isPrivate,
			passwordHash
		})
		.returning({ roomId: room.id });

	return json({ roomId: created.roomId }, { status: 201 });
};