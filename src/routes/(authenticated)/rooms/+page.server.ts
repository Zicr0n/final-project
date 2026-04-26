import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { room } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import argon2 from 'argon2';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
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

	return { rooms };
};

export const actions: Actions = {
	verifyPassword: async ({ request }) => {
		const formData = await request.formData();
		const roomId = Number(formData.get('roomId'));
		const password = formData.get('password')?.toString() ?? '';

		const [found] = await db
			.select({ isPrivate: room.isPrivate, passwordHash: room.passwordHash })
			.from(room)
			.where(eq(room.id, roomId));

		if (!found) return fail(404, { error: 'Room not found' });
		if (!found.isPrivate || !found.passwordHash) throw redirect(302, `/rooms/${roomId}`);

		const ok = await argon2.verify(found.passwordHash, password);
		if (!ok) return fail(401, { roomId, error: 'Wrong password' });

		throw redirect(302, `/rooms/${roomId}`);
	}
};