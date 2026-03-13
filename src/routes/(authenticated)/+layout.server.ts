import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

export const load: LayoutServerLoad = async (event) => {
    const session = await auth.api.getSession({
        headers: event.request.headers
    });

    if (!session) {
        throw redirect(307, '/login');
    }

    return {
        user: session.user
    };
};
