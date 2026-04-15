import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';
import { db } from '$lib/server/db';
import { character } from '$lib/server/db/schema';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		throw redirect(302, '/demo/better-auth');
	}

	return {};
};

export const actions: Actions = {
	signInEmail: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		try {
			await auth.api.signInUsername({
				body: {
					username,
					password,
					callbackURL: '/auth/verification-success'
				}
			});
		} catch (error) {
			console.log(error);

			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Signin failed' });
			}

			return fail(500, { message: 'Unexpected error' });
		}

		throw redirect(302, '/rooms');
	},

	signUpEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const name = formData.get('name')?.toString() ?? '';
		const username = formData.get('username')?.toString() ?? '';

		try {
			const response = await auth.api.isUsernameAvailable({
				body: {
					username
				}
			});

			if (!response?.available) {
				return fail(400, { message: 'Username already exists' });
			}

			await auth.api.signUpEmail({
				body: {
					email,
					password,
					name,
					username,
					callbackURL: '/auth/verification-success'
				}
			});

			const newUser = await db.query.user.findFirst({
				where: (u, { eq }) => eq(u.email, email)
			});

			if (!newUser) {
				throw new Error('User not found after signup');
			}

			const existingCharacter = await db.query.character.findFirst({
				where: (c, { eq }) => eq(c.userId, newUser.id)
			});

			if (!existingCharacter) {
				await db.insert(character).values({
					userId: newUser.id,
					hatId: 0,
					shirtId: 0,
					eyesId: 0
				});
			}
		} catch (error) {
			console.log(error);

			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Registration failed' });
			}

			return fail(500, { message: 'Unexpected error' });
		}

		throw redirect(302, '/rooms');
	}
};
