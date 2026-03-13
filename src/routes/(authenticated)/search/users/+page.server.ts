import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { ilike } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
    const query = url.searchParams.get("q")?.trim() ?? "";

    if (!query) return { results: [], query: "" };

    const results = await db.select({
        id: user.id,
        username: user.username,
        image: user.image,
    })
    .from(user)
    .where(ilike(user.username, `%${query}%`))
    .limit(20);

    return { results, query };
};