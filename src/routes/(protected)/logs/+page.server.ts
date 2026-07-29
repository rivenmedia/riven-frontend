import type { PageServerLoad } from "./$types";
import { requireSettingsAccess } from "$lib/server/rbac";

export const load = (async ({ locals }) => {
    requireSettingsAccess(locals.user);
    return {};
}) satisfies PageServerLoad;
