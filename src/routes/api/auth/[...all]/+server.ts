import { auth } from "$lib/server/auth";
import type { RequestEvent } from "@sveltejs/kit";

export const GET = async (event: RequestEvent) => {
    return auth.handler(event.request);
};

export const POST = async (event: RequestEvent) => {
    return auth.handler(event.request);
};
