import { isFirstLaunchSetupComplete } from "./first-launch";

let settled = false;

export async function instanceNeedsSetup(
    backendUrl: string,
    apiKey: string,
    fetchFn: typeof fetch
): Promise<boolean> {
    if (settled) return false;

    const setupComplete = await isFirstLaunchSetupComplete(backendUrl, apiKey, fetchFn);
    if (setupComplete) {
        settled = true;
        return false;
    }

    return true;
}
