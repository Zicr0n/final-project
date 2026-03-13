import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import type { Actions } from './$types';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();
	return { user: user };
};

export const actions: Actions = {
	signOut: async (event) => {
		await auth.api.signOut({
			headers: event.request.headers
		});
		return redirect(302, '/login');
	},
	changePassword: async ({ request }) => {
		const formData = await request.formData();
		const newPassword = formData.get('newPassword');
		const currentPassword = formData.get('currentPassword') ?? '';

		if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
			throw new Error('Invalid form data');
		}

		if (newPassword === currentPassword) {
			return fail(400, { error: 'New Password Cannot Be Current Password' });
		}

		try {
			const data = await auth.api.changePassword({
				body: {
					newPassword: newPassword, // required
					currentPassword: currentPassword, // required
					revokeOtherSessions: true
				},
				// This endpoint requires session cookies.
				headers: request.headers
			});

			return redirect(303, '/settings');
		} catch (error) {
			console.log(error);
			return fail(error.statusCode, {
				error: error?.body?.message
			});
		}
	},
	changeUsername: async ({ request, locals }) => {
		const formData = await request.formData();
		const username = formData.get('username');

		if (typeof username !== 'string' || username.length === 0) {
			return fail(400, { error: 'Invalid username' });
		}

		const userId = locals.user?.id;

		if (!userId) {
			return fail(401, { error: 'Not authenticated' });
		}

		const response = await auth.api.isUsernameAvailable({
			body: {
				username: username // required
			}
		});

		try {
			if (response?.available) {
				const data = await auth.api.updateUser({
					body: {
						username: username
					},
					headers: request.headers
				});
			} else {
				return fail(400, { error: 'Username already taken!' });
			}
		} catch (error) {
			console.log(error);
			return fail(400, { error: error.message });
		}
	}
};
