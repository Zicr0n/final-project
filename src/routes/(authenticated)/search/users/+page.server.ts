import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { ilike } from 'drizzle-orm';
import { ne, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, params, parent }) => {
    const data = await parent()
    const query = url.searchParams.get("q")?.trim() ?? "";

    if (!query) return { results: [], query: "" };

    const results = await db.select({
        id: user.id,
        username: user.username,
        image: user.image,
    })
    .from(user)
    .where(and(ilike(user.username, `%${query}%`),  ne(user.id, data.user.id)) )
    .limit(20);

    return { results, query };
};