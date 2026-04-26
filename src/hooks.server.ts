import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	const theme = event.cookies.get('theme') ?? 'crimson';
	const mode = event.cookies.get('mode') ?? 'dark';

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({
		event,
		resolve: (event) =>
			resolve(event, {
				transformPageChunk: ({ html }) =>
					html
						.replace('data-theme="crimson"', `data-theme="${theme}"`)
						.replace('data-mode="dark"', `data-mode="${mode}"`)
			}),
		auth,
		building
	});
};

export const handle: Handle = handleBetterAuth;
