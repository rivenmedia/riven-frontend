import { auth } from "$lib/server/auth";
import type { RequestEvent } from "@sveltejs/kit";

export const { GET, POST } = auth.handler;
