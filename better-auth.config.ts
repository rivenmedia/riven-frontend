////////////////////////////////////
// THIS IS JUST A COPY OF src/lib/server/auth.ts FILE
// IT'S MADE BECAUSE BETTER-AUTH CONFIG DOESN'T SUPPORT SVELTE-KIT $ IMPORT
// KEEP IT IN SYNC WITH src/lib/server/auth.ts EXCEPT FOR SVELTE-KIT $ IMPORT AND RELATED IMPORTS
////////////////////////////////////

import { betterAuth } from 'better-auth';
import Database from 'better-sqlite3';
import { username } from 'better-auth/plugins';
// import { sveltekitCookies } from 'better-auth/svelte-kit';
// import { getRequestEvent } from '$app/server';
import { admin } from 'better-auth/plugins';

export const auth = betterAuth({
	database: new Database(process.env.DATABASE_URL!),
	emailAndPassword: {
		enabled: true
	},
	plugins: [username(), admin()],
	advanced: {
		cookiePrefix: 'riven'
	}
});
