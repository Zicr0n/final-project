import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user, galleryImage, friendRequest } from '$lib/server/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { getFriendStatus } from '$lib/server/friends';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load: PageServerLoad = async ({ request, params }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session?.user) {
		throw error(401, 'Unauthorized');
	}

	const profileUser = await db.query.user.findFirst({
		where: eq(user.id, params.id)
	});

	if (!profileUser) {
		throw error(404, 'User not found');
	}

	const isOwner = session?.user.id === profileUser.id;

	if (!isOwner) {
		throw redirect(302, '/profile/' + profileUser.id + '/' + 'friends');
	}

	const userId = params.id;

	const friendRequests = await db
		.select()
		.from(friendRequest)
		.where(
			and(
				eq(friendRequest.status, 'accepted'),
				or(
					eq(friendRequest.receiverId, userId),
					eq(friendRequest.senderId, userId)
				)
			)
		);

	return {
		friendRequests
	};
};

export const actions: Actions = {
	acceptRequest: async ({ request }) => {
		const formData = await request.formData();
		const requestIdRaw = formData.get('requestId');
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session) {
			return;
		}

		const requestId = Number(requestIdRaw);

		if (!requestId) {
			return fail(400, { error: 'Invalid request id' });
		}

		await db
			.update(friendRequest)
			.set({ status: 'accepted' })
			.where(
				and(
					eq(friendRequest.id, requestId),
					eq(friendRequest.receiverId, session.user.id) // bara mottagaren kan acceptera
				)
			);
	},
	rejectRequest: async ({ request }) => {
		const formData = await request.formData();
		const requestIdRaw = formData.get('requestId');
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session) {
			return;
		}

		const requestId = Number(requestIdRaw);

		if (!requestId) {
			return fail(400, { error: 'Invalid request id' });
		}

		await db
			.update(friendRequest)
			.set({ status: 'rejected' })
			.where(and(eq(friendRequest.id, requestId), eq(friendRequest.receiverId, session.user.id)));
	}
};
