import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ parent }) => {
    const { user } = await parent();
    return { user };
};

export const actions: Actions = {
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
            await auth.api.changePassword({
                body: {
                    newPassword,
                    currentPassword,
                    revokeOtherSessions: true
                },
                headers: request.headers
            });

            return redirect(303, '/settings');
        } catch (error: any) {
            return fail(error.statusCode ?? 400, {
                error: error?.body?.message ?? 'Failed to change password'
            });
        }
    }
};
