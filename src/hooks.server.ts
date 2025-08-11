import { auth } from '$lib/server/auth';
import { redirect, type Handle, type ServerInit } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { getUsersCount } from '$lib/server/functions';

export const init: ServerInit = async () => {
	const userCount = (await getUsersCount())[0].count;

	if (userCount === 0) {
		console.warn('No users found in the database. Creating an admin user...');

		const data = await auth.api.createUser({
			body: {
				name: 'Admin',
				email: 'admin@admin.com',
				password: 'admin',
				role: ['admin'],
				data: {
					username: 'admin'
				}
			}
		});

		console.log('Admin user created:', data);
	}
};

export const handle: Handle = async ({ event, resolve }) => {
	if (event.route.id?.startsWith('/(protected)')) {
		const session = await auth.api.getSession({
			headers: event.request.headers
		});

		if (session) {
			event.locals.session = session?.session;
			event.locals.user = session?.user;
			return svelteKitHandler({ event, resolve, auth, building });
		} else {
			redirect(307, '/auth/login');
		}
	} else {
		return svelteKitHandler({ event, resolve, auth, building });
	}
};
