import { db } from './db';

export async function getUsersCount() {
	return await db
		.selectFrom('user')
		.select((eb) => eb.fn.countAll().as('count'))
		.execute();
}
