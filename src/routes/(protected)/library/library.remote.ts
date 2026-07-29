import { command } from "$app/server";
import { z } from "zod";
import { gql } from "$lib/graphql-client";
import { getRequestEvent } from "$app/server";
import { buildBackendRoleHeaders, requireLibraryAccess } from "$lib/server/rbac";
import {
    REMOVE_ITEMS_MUTATION,
    RESET_ITEMS_MUTATION,
    RETRY_ITEMS_MUTATION,
    toNumericIds
} from "$lib/services/library-mutations";

const itemIdsSchema = z.object({
    ids: z.array(z.string())
});

export const reset_items = command(itemIdsSchema, async ({ ids }) => {
    const event = getRequestEvent();
    if (!event) throw new Error("No event found");
    requireLibraryAccess(event.locals.user);

    const { backendUrl, apiKey } = event.locals;
    if (!backendUrl || !apiKey) throw new Error("Backend URL or API key missing");

    const numericIds = toNumericIds(ids);
    const data = await gql<{ resetItems: number }>(
        backendUrl,
        apiKey,
        RESET_ITEMS_MUTATION,
        { ids: numericIds },
        undefined,
        buildBackendRoleHeaders(event.locals.user, event.locals.backendAuthSigningSecret)
    );

    return { success: true, count: data.resetItems };
});

export const retry_items = command(itemIdsSchema, async ({ ids }) => {
    const event = getRequestEvent();
    if (!event) throw new Error("No event found");
    requireLibraryAccess(event.locals.user);

    const { backendUrl, apiKey } = event.locals;
    if (!backendUrl || !apiKey) throw new Error("Backend URL or API key missing");

    const numericIds = toNumericIds(ids);
    const data = await gql<{ retryItems: number }>(
        backendUrl,
        apiKey,
        RETRY_ITEMS_MUTATION,
        { ids: numericIds },
        undefined,
        buildBackendRoleHeaders(event.locals.user, event.locals.backendAuthSigningSecret)
    );

    return { success: true, count: data.retryItems };
});

export const remove_items = command(itemIdsSchema, async ({ ids }) => {
    const event = getRequestEvent();
    if (!event) throw new Error("No event found");
    requireLibraryAccess(event.locals.user);

    const { backendUrl, apiKey } = event.locals;
    if (!backendUrl || !apiKey) throw new Error("Backend URL or API key missing");

    const numericIds = toNumericIds(ids);
    const data = await gql<{ removeItems: number }>(
        backendUrl,
        apiKey,
        REMOVE_ITEMS_MUTATION,
        { ids: numericIds },
        undefined,
        buildBackendRoleHeaders(event.locals.user, event.locals.backendAuthSigningSecret)
    );

    return { success: true, count: data.removeItems };
});
