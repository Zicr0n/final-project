// src/routes/(authenticated)/rooms/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { room } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import argon2 from 'argon2';
import { auth } from '$lib/server/auth';

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

export const POST: RequestHandler = async ({ request, cookies }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return json({ error: 'Unauthorized' }, { status: 401 });

    const { name, maxPlayers, password } = await request.json();

    if (!name?.trim()) return json({ error: 'Room name required' }, { status: 400 });
    if (maxPlayers < 1 || maxPlayers > 50) return json({ error: 'Max room size is 50' }, { status: 400 });

    const isPrivate = !!password?.trim();
    const passwordHash = isPrivate ? await argon2.hash(password.trim()) : null;

    const [created] = await db
        .insert(room)
        .values({
            name: name.trim(),
            maxPlayers,
            isPrivate,
            passwordHash,
            ownerId: session.user.id,
            type: 'bomb'
        })
        .returning({ id: room.id });

    if (isPrivate) {
        cookies.set(`room_access_${created.id}`, `granted_${created.id}`, {
            path: '/',
            httpOnly: true,
            maxAge: 60 * 60,
            sameSite: 'strict'
        });
    }

    return json({ roomId: created.id });
};
