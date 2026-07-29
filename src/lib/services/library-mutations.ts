/**
 * Centralised library mutation operations (reset / retry / remove).
 *
 * These mutations were previously duplicated as inline strings across the
 * media item-action / item-request components and the library remote
 * functions. Keep them here as the single source of truth.
 *
 * The `*_ITEMS_MUTATION` constants are transport-agnostic and consumed both
 * server-side (via `gql` in library.remote.ts) and client-side. The exported
 * helper functions wrap the client-side `gqlClient` proxy for component use.
 */

import { gqlClient } from "$lib/graphql-client";

export const RESET_ITEMS_MUTATION = `mutation ResetItems($ids: [Int!]!) { resetItems(ids: $ids) }`;
export const RETRY_ITEMS_MUTATION = `mutation RetryItems($ids: [Int!]!) { retryItems(ids: $ids) }`;
export const REMOVE_ITEMS_MUTATION = `mutation RemoveItems($ids: [Int!]!) { removeItems(ids: $ids) }`;
export const PAUSE_ITEMS_MUTATION = `mutation PauseItems($ids: [Int!]!) { pauseItems(ids: $ids) }`;
export const UNPAUSE_ITEMS_MUTATION = `mutation UnpauseItems($ids: [Int!]!) { unpauseItems(ids: $ids) }`;

/** Coerce mixed/nullable id inputs into a clean numeric id array. */
export function toNumericIds(ids: (string | number | null | undefined)[]): number[] {
    return ids
        .filter((id): id is string | number => id !== null && id !== undefined)
        .map(Number)
        .filter((n) => !Number.isNaN(n));
}

/** Reset the given items via the client-side `/graphql` proxy. Returns the affected count. */
export async function resetItems(ids: number[]): Promise<number> {
    const result = await gqlClient<{ resetItems: number }>(RESET_ITEMS_MUTATION, { ids });
    return result.resetItems;
}

/** Retry the given items via the client-side `/graphql` proxy. Returns the affected count. */
export async function retryItems(ids: number[]): Promise<number> {
    const result = await gqlClient<{ retryItems: number }>(RETRY_ITEMS_MUTATION, { ids });
    return result.retryItems;
}

/** Remove the given items via the client-side `/graphql` proxy. Returns the affected count. */
export async function removeItems(ids: number[]): Promise<number> {
    const result = await gqlClient<{ removeItems: number }>(REMOVE_ITEMS_MUTATION, { ids });
    return result.removeItems;
}

/** Pause the given items via the client-side `/graphql` proxy. Returns the affected count. */
export async function pauseItems(ids: number[]): Promise<number> {
    const result = await gqlClient<{ pauseItems: number }>(PAUSE_ITEMS_MUTATION, { ids });
    return result.pauseItems;
}

/** Unpause the given items via the client-side `/graphql` proxy. Returns the affected count. */
export async function unpauseItems(ids: number[]): Promise<number> {
    const result = await gqlClient<{ unpauseItems: number }>(UNPAUSE_ITEMS_MUTATION, { ids });
    return result.unpauseItems;
}

/** Pause or unpause the given items depending on `paused`. Returns the affected count. */
export async function setItemsPaused(ids: number[], paused: boolean): Promise<number> {
    return paused ? pauseItems(ids) : unpauseItems(ids);
}
