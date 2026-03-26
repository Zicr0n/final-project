import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';
import { db } from '$lib/server/db';
import { character } from '$lib/server/db/schema';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/demo/better-auth');
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
					username: username,
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

		return redirect(302, '/rooms');
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
					username: username // required
				}
			});

			if (response?.available) {
				console.log('Username is available');
			} else {
				return Error('Username Already Exists!');
			}

			// get the user you just created
			const newUser = await db.query.user.findFirst({
				where: (u, { eq }) => eq(u.email, email)
			});

			if (!newUser) {
				throw new Error('User not found after signup');
			}

			await db.insert(character).values({
				userId: newUser.id
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Registration failed' });
			}

			console.log(error)

			return fail(500, { message: 'Unexpected error' });
		}

		return redirect(302, '/rooms');
	}
};
