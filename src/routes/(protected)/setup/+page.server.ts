import type { PageServerLoad } from "./$types";
import { load as settingsLoad } from "../settings/+page.server";
import { requireSettingsAccess } from "$lib/server/rbac";

// Whether the wizard should show at all is decided once, in the auth hook
// (`instanceNeedsSetup`): it redirects away from /setup when setup is done and
// requires a session for protected routes. So this load just gates on settings
// access and reuses the settings loader for the wizard's data.
export const load: PageServerLoad = async (event) => {
    requireSettingsAccess(event.locals.user);
    return settingsLoad(event as never);
};
