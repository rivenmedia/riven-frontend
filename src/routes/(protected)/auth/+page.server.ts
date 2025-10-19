import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { getAuthProviders } from "$lib/server/auth";

export const load: PageServerLoad = async (event) => {
    if (!event.locals.user || !event.locals.session) {
        return redirect(302, "/auth/login");
    }

    return {
        user: event.locals.user,
        session: event.locals.session,
        authProviders: getAuthProviders()
    };
};
