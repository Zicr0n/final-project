import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { character, user } from '$lib/server/db/schema';
import type { Actions } from './$types';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, parent }) => {
    const { user } = await parent();

   const char = await db.query.character.findFirst({
        where: (c, { eq }) => eq(c.userId, user.id)
    });

    if (!char) {
        await db.insert(character).values({
            userId: user.id
        });
    }

    return { user: user, char : char };
};

export const actions: Actions = {

}
