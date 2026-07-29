import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { getPermissionFlags } from "$lib/permissions";
import { instanceNeedsSetup } from "$lib/server/setup-gate";

export const load = (async ({ locals, route, fetch }) => {
    // First-run setup gating lives here (not in the auth hook) so it runs only
    // for page loads. `+server` endpoints — notably the /graphql proxy the
    // wizard reads and saves through — don't run layout loads, so they're exempt
    // by construction. Authentication/login still happens in the hook.
    const needsSetup = await instanceNeedsSetup(locals.backendUrl, locals.apiKey, fetch);
    const isSetupRoute = route.id === "/(protected)/setup";

    if (needsSetup && !isSetupRoute) {
        redirect(302, "/setup");
    }
    if (!needsSetup && isSetupRoute) {
        redirect(302, "/");
    }

    return {
        user: locals.user,
        permissions: getPermissionFlags(locals.user?.role)
    };
}) satisfies LayoutServerLoad;
