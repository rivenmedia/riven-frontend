import { hash, verify } from '@node-rs/argon2';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { superValidate, message } from 'sveltekit-superforms/server';
import { loginSchema, registerSchema } from '$lib/schemas/auth';
import type { Actions, PageServerLoad } from './$types';
import { zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/auth');
	}
	const loginForm = await superValidate(zod(loginSchema), {
		id: 'loginForm'
	});
	const registerForm = await superValidate(zod(registerSchema), {
		id: 'registerForm'
	});
	return { loginForm, registerForm };
};

export const actions: Actions = {
	login: async (event) => {
		const loginForm = await superValidate(event.request, zod(loginSchema));
		if (!loginForm.valid) return fail(400, { loginForm });

		const results = await db
			.select()
			.from(table.user)
			.where(eq(table.user.username, loginForm.data.username));

		const existingUser = results.at(0);
		if (!existingUser) {
			return message(loginForm, 'Incorrect username or password', {
				status: 400
			});
		}

		const validPassword = await verify(existingUser.passwordHash, loginForm.data.password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		if (!validPassword) {
			return message(loginForm, 'Incorrect username or password', {
				status: 400
			});
		}

		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, existingUser.id);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

		return redirect(302, '/auth');
	},
	register: async (event) => {
		const registerForm = await superValidate(event.request, zod(registerSchema));
		if (!registerForm.valid) return fail(400, { registerForm });

		if (registerForm.data.password !== registerForm.data.confirmPassword) {
			return message(registerForm, 'Passwords do not match', {
				status: 400
			});
		}

		const userId = generateUserId();
		const passwordHash = await hash(registerForm.data.password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		try {
			await db
				.insert(table.user)
				.values({ id: userId, username: registerForm.data.username, passwordHash: passwordHash });

			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, userId);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} catch {
			return message(registerForm, 'Username already exists', {
				status: 400
			});
		}
		return redirect(302, '/auth');
	}
};

function generateUserId() {
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	const id = encodeBase32LowerCase(bytes);
	return id;
}
