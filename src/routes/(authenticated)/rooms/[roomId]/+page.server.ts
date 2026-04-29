import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { room, character } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import argon2 from 'argon2';

export const load: PageServerLoad = async ({ params, parent, url, cookies }) => {
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
			type: room.type,
			ownerId: room.ownerId,
			isPrivate: room.isPrivate,
			passwordHash: room.passwordHash
		})
		.from(room)
		.where(eq(room.id, roomId));

	if (!found) throw redirect(302, '/rooms');

	// if (found.isPrivate && found.passwordHash) {
	// 	const cookieKey = `room_access_${roomId}`;
	// 	const existingCookie = cookies.get(cookieKey);

	// 	if (existingCookie !== `granted_${roomId}`) {
	// 		const password = pendingRoomPassword.set(roomPassword);
	// 		if (!password) {
	// 			console.log("no pass")
	// 			throw redirect(302, `/rooms`);
	// 		}

	// 		const ok = await argon2.verify(found.passwordHash, password);
	// 		if (!ok) {
	// 			console.log("pass wrong")
	// 			throw redirect(302, `/rooms`);
	// 		}
	// 	}
	// }

	// const [char] = await db
	// 	.select({
	// 		id: character.id,
	// 		userId: character.userId,
	// 		hatId: character.hatId,
	// 		shirtId: character.shirtId,
	// 		eyesId: character.eyesId,
	// 		bodyColor: character.bodyColor
	// 	})
	// 	.from(character)
	// 	.where(eq(character.userId, user.id));

	// if (!char) throw error(404, 'Character not found');

	return {
		roomId,
		room: found,
		user,
		// char
	};
};