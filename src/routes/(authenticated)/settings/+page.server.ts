import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '$lib/server/r2';
import { R2_BUCKET } from '$env/static/private';
import { PUBLIC_R2_BASE_URL } from '$env/static/public';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	return { user };
};

export const actions: Actions = {
	signOut: async (event) => {
		console.log('sign out');
		await auth.api.signOut({
			headers: event.request.headers
		});
		return redirect(302, '/');
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
			body: { username }
		});

		try {
			if (response?.available) {
				await auth.api.updateUser({
					body: { username },
					headers: request.headers
				});
				return { success: true };
			}

			return fail(400, { error: 'Username already taken!' });
		} catch (error: any) {
			return fail(400, { error: error.message ?? 'Failed to change username' });
		}
	},

	uploadProfile: async ({ request, locals }) => {
		const formData = await request.formData();
		const file = formData.get('image');
		const thisUser = locals.user;

		if (!thisUser) {
			return fail(401, { error: 'User not found' });
		}

		if (!(file instanceof File)) {
			return fail(400, { error: 'No file uploaded', filetype: true });
		}

		const validImageTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/apng', 'image/webp'];
		if (!validImageTypes.includes(file.type)) {
			return fail(400, { error: 'Invalid file type', filetype: true });
		}

		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			return fail(400, { error: 'File too large', fileSize: true });
		}

		const extMap: Record<string, string> = {
			'image/png': 'png',
			'image/jpeg': 'jpg',
			'image/gif': 'gif',
			'image/apng': 'png',
			'image/webp': 'webp'
		};

		const body = Buffer.from(await file.arrayBuffer());

		const fileType = file.type;
		const ext = fileType.split('/')[1];

		const key = `avatars/${thisUser.id}.${ext}`;

		await r2.send(
			new PutObjectCommand({
				Bucket: R2_BUCKET,
				Key: key,
				Body: body,
				ContentType: fileType
			})
		);

		const imageUrl = `${PUBLIC_R2_BASE_URL}/${key}`;

		await db.update(user).set({ image: imageUrl }).where(eq(user.id, thisUser.id));

		return { success: true, imageUrl };
	}
};
