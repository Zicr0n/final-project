import type { Actions, PageServerLoad } from './$types';
import { ilike } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user, friendRequest } from '$lib/server/db/schema';
import { eq, or, and, ne } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';


export const load: PageServerLoad = async ({ url, params, parent }) => {
	const data = await parent();
	const query = url.searchParams.get('q')?.trim() ?? '';

	if (!query) return { results: [], query: '' };

	const results = await db
		.select({
			id: user.id,
			username: user.username,
			image: user.image
		})
		.from(user)
		.where(and(ilike(user.username, `%${query}%`), ne(user.id, data.user.id)))
		.limit(20);

	return { results, query };
};

export const actions: Actions = {
	sendRequest: async ({ request, params }) => {
		const formData = await request.formData()
		const receiverId = formData.get("otherId");

		const sender = await auth.api.getSession({
			headers: request.headers
		});

		if (!sender?.user?.id) {
			return fail(401, { error: 'Unauthorized' });
		}

		const senderId = sender.user.id;

		const existing = await db
			.select()
			.from(friendRequest)
			.where(
				or(
					and(eq(friendRequest.senderId, senderId), eq(friendRequest.receiverId, receiverId)),
					and(eq(friendRequest.senderId, receiverId), eq(friendRequest.receiverId, senderId))
				)
			)
			.limit(1);

		if (existing.length) return fail(400, { message: 'Request already exists' });

		await db.insert(friendRequest).values({
			senderId: senderId,
			receiverId: receiverId
		});

	}

};
