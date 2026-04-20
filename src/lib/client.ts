import { createAuthClient } from 'better-auth/svelte'; // make sure to import from better-auth/svelte
import { usernameClient, anonymousClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	plugins: [usernameClient(), anonymousClient()]
});
