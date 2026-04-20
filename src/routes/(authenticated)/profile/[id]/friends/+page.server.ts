import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user, galleryImage, friendRequest } from '$lib/server/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { getFriendStatus } from '$lib/server/friends';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}

	const friendRequests = await db
		.select()
		.from(friendRequest)
		.where(
			and(eq(friendRequest.receiverId, session.user.id), eq(friendRequest.status, 'accepted'))
		);

	return {
		friendRequests
	};
};

export const actions: Actions = {
	removeFriend: async ({ request }) => {
		const formData = await request.formData();
		const requestId = formData.get('requestId');

		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session || !requestId) {
			return fail(400, { message: 'Missing requestId' });
		}

		await db
			.delete(friendRequest)
			.where(
				and(eq(friendRequest.id, Number(requestId)), eq(friendRequest.receiverId, session.user.id))
			);
	}
};
