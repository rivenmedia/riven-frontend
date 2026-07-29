import { gql } from "$lib/graphql-client";
import { getUsersCount } from "./functions";

const INSTANCE_STATUS_QUERY = `query { instanceStatus { setupCompleted } }`;

export async function noUserExists() {
    const count = await getUsersCount();
    return count === 0;
}

export async function isFirstLaunchSetupComplete(
    backendUrl: string,
    apiKey: string,
    fetchFn: typeof fetch
) {
    const result = await gql<{ instanceStatus: { setupCompleted: boolean } }>(
        backendUrl,
        apiKey,
        INSTANCE_STATUS_QUERY,
        {},
        fetchFn
    ).catch(() => ({ instanceStatus: { setupCompleted: false } }));

    return result.instanceStatus.setupCompleted === true;
}
