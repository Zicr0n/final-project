import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user, galleryImage, friendRequest } from '$lib/server/db/schema';
import { eq, or, and, aliasedTable } from 'drizzle-orm';
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
	
	const params = event.params

	const isOwner = session.user.id === event.params.id;

	const senderUser = aliasedTable(user, 'sender_user');
	const receiverUser = aliasedTable(user, 'receiver_user');

	const friendRequests = await db
		.select({
			id: friendRequest.id,
			status: friendRequest.status,
			createdAt: friendRequest.createdAt,
			senderId: friendRequest.senderId,
			receiverId: friendRequest.receiverId,
			sender: {
				id: senderUser.id,
				name: senderUser.name,
				username: senderUser.username,
				image: senderUser.image
			},
			receiver: {
				id: receiverUser.id,
				name: receiverUser.name,
				username: receiverUser.username,
				image: receiverUser.image
			}
		})
		.from(friendRequest)
		.innerJoin(senderUser, eq(friendRequest.senderId, senderUser.id))
		.innerJoin(receiverUser, eq(friendRequest.receiverId, receiverUser.id))
		.where(
			or(
				eq(friendRequest.receiverId, params.id),
				eq(friendRequest.senderId, params.id)
			)
		);

	return {
		friendRequests,
		isOwner,
		user: session.user,
		profileId: params.id
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
	},
	acceptRequest: async ({ request }) => {
		console.log('accept');
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
