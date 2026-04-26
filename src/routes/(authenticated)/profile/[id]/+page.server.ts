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

	const profileUser = await db.query.user.findFirst({
		where: eq(user.id, event.params.id)
	});

	if (!profileUser) {
		throw error(404, 'User not found');
	}

	const isOwner = session?.user.id === profileUser.id;

	const friendStatus = await getFriendStatus(session?.user.id, profileUser.id);

	const friendCount = await db.query.friendRequest.findMany({
		where: and(
			or(eq(friendRequest.receiverId, profileUser.id), eq(friendRequest.senderId, profileUser.id)),
			eq(friendRequest.status, 'accepted')
		)
	});

	return {
		friendStatus,
		friends: friendCount.length,
		profileUser,
		isOwner
	};
};

export const actions: Actions = {
	sendRequest: async ({ request, params }) => {
		const receiverId = params.id;

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
	},
	updateDescription: async ({ request, params }) => {
		const formData = await request.formData();
		const description = formData.get('description') as string | null;

		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session) return;

		await db.update(user).set({ description: description }).where(eq(user.id, session.user.id));
	}
};
