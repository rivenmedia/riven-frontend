////////////////////////////////////
// MAKE SURE TO KEEP THIS IN SYNC WITH better-auth.config.ts EXCEPT FOR SVELTE-KIT $ IMPORT
// AS IT IS USED FOR BETTER-AUTH CLI
//////////////////////////////////////

import { betterAuth } from 'better-auth';
import Database from 'better-sqlite3';
import { DATABASE_URL } from '$env/static/private';
import { username } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';

export const auth = betterAuth({
	database: new Database(DATABASE_URL),
	emailAndPassword: {
		enabled: true
	},
	plugins: [username(), sveltekitCookies(getRequestEvent)],
	advanced: {
		cookiePrefix: 'riven'
	}
});
