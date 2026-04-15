import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { character } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { VALID_HAT_IDS, VALID_SHIRT_IDS, VALID_EYES_IDS } from '$lib/constants/character';

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

export const actions = {
	saveCharacter: async ({ request, locals }) => {
		const formData = await request.formData();
		const user = locals.user;
		let hatId = Number(formData.get('hatId'));
		let eyesId = Number(formData.get('eyesId'));
		let shirtId = Number(formData.get('shirtId'));
		const bodyColor = formData.get('bodyColor') ?? 0;

		if (!user) {
			throw fail(404, { message: 'User not found' });
		}

		if (isNaN(hatId) || isNaN(eyesId) || isNaN(shirtId)) {
			return fail(400, { error: 'Invalid input' });
		}

		if (!VALID_HAT_IDS.includes(hatId)) hatId = 0;
		if (!VALID_SHIRT_IDS.includes(shirtId)) shirtId = 0;
		if (!VALID_EYES_IDS.includes(eyesId)) eyesId = 0;

		await db
			.update(character)
			.set({
				hatId: hatId,
				eyesId: eyesId,
				shirtId: shirtId,
				bodyColor: bodyColor
			})
			.where(eq(character.userId, user.id));
	}
};
