import type { Kysely } from 'kysely';
import type { DB } from './types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			BACKEND_URL: string;
			db: Kysely<DB>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
