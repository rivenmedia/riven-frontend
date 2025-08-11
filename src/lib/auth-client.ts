import { createAuthClient } from 'better-auth/svelte';
import { usernameClient } from 'better-auth/client/plugins';
import { adminClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	plugins: [usernameClient(), adminClient()]
});
export const { signIn, signUp, useSession } = authClient;
