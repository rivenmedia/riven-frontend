import type { Kysely } from 'kysely';

declare global {
	namespace App {
		interface Locals {
			backendUrl: string;
			apiKey: string;
		}
	}
}

export {};
