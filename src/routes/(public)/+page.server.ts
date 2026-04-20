import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';
import { db } from '$lib/server/db';
import { character } from '$lib/server/db/schema';
import { authClient } from '$lib/client';

export const actions: Actions = {
	login: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		console.log('login');

		try {
			await auth.api.signInUsername({
				body: {
					username,
					password,
					callbackURL: '/auth/verification-success'
				}
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Signin failed' });
			}

			return fail(500, { message: 'Unexpected error' });
		}

		throw redirect(302, '/rooms');
	},

	register: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const username = formData.get('username')?.toString() ?? '';
		console.log('register');

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
					name: '',
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
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Registration failed' });
			}

			return fail(500, { message: 'Unexpected error' });
		}

		throw redirect(302, '/rooms');
	},

	anonymousSignIn: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username')?.toString() ?? '';

		const session = await auth.api.getSession({ headers: event.request.headers });

		if (!session?.user) {
			return fail(401, { message: 'Not signed in' });
		}

		if (!username || username.length < 2) {
			return fail(400, { message: 'Username too short' });
		}

		const available = await auth.api.isUsernameAvailable({ body: { username } });
		if (!available?.available) {
			return fail(400, { message: 'Username taken' });
		}

		await auth.api.updateUser({
			body: { username, displayUsername: username, name: username },
			headers: event.request.headers
		});

		throw redirect(302, '/rooms');
	}
};
