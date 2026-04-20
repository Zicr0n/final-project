import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { usernameClient } from 'better-auth/client/plugins';
import { username, anonymous } from 'better-auth/plugins';

export const auth = betterAuth({
	user: {
		additionalFields : {
			username : {
				type : 'string',
				required : false,
				defaultValue : ''
			},
			displayUsername: {
                type: 'string',
                required: false,
                defaultValue: ''
            }
		}
	},
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: { enabled: true },
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 1 * 60,
			strategy: 'compact'
		},
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		freshAge: 60 * 5
	},
	plugins: [
		anonymous({
            generateName: () => `guest_${Math.random().toString(36).slice(2, 8)}`
        }),
		username(), 
		usernameClient(), 
		sveltekitCookies(getRequestEvent)] // make sure this is the last plugin in the array
});
