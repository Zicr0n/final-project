import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user, galleryImage } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
    const session = await auth.api.getSession({
        headers: event.request.headers
    });

    const profileUser = await db.query.user.findFirst({
        where: eq(user.id, event.params.id)
    });

    if (!profileUser) {
        throw error(404, 'User not found');
    }

    const isOwner = session?.user.id === profileUser.id;

    return {
        profileUser,
        isOwner
    };
};