import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { character } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	let char = await db.query.character.findFirst({
		where: (c, { eq }) => eq(c.userId, user.id)
	});

	if (!char) {
		await db.insert(character).values({
			userId: user.id,
			hatId: 0,
			shirtId: 0,
			eyesId: 0
		});

		char = await db.query.character.findFirst({
			where: (c, { eq }) => eq(c.userId, user.id)
		});
	}

	return { user, char };
};

export const actions = {};