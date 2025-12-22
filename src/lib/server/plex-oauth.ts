/**
 * Plex OAuth Provider for Better Auth Generic OAuth Plugin
 *
 * Implements Plex's PIN-based authentication flow as a generic OAuth provider.
 * Unlike traditional OAuth2, Plex uses a PIN-based flow:
 * 1. Generate a PIN from Plex API
 * 2. Redirect user to Plex auth page with the PIN
 * 3. Poll/check the PIN status for the auth token
 * 4. Use the auth token to fetch user info
 *
 * Since the generic OAuth plugin expects standard OAuth2 flow, this implementation
 * uses a workaround:
 * - The authorization URL generation is handled separately via a custom endpoint
 * - The getToken function validates the PIN and retrieves the auth token
 * - The getUserInfo function fetches user data from Plex API
 */

import type { GenericOAuthConfig } from "better-auth/plugins";

export interface PlexProfile {
    id: number;
    uuid: string;
    username: string;
    title: string;
    email: string;
    thumb: string;
    locale: string | null;
    emailOnlyAuth: boolean;
    hasPassword: boolean;
    protected: boolean;
    scrobbleTypes: string;
    country: string;
    subscription: {
        active: boolean;
        status: string;
        plan: string;
        features: string[];
    };
    subscriptionDescription: string;
    restricted: boolean;
    home: boolean;
    guest: boolean;
    homeSize: number;
    maxHomeSize: number;
    certificateVersion: number;
    rememberMe: boolean;
    pin: string;
    adsConsent: boolean | null;
    adsConsentSetAt: number | null;
    adsConsentReminderAt: number | null;
    experimentalFeatures: boolean;
    twoFactorEnabled: boolean;
    backupCodesCreated: boolean;
    services: Array<{
        identifier: string;
        endpoint: string;
        token: string;
        status: string;
        secret: string | null;
    }>;
}

export interface PlexOAuthOptions {
    /**
     * A unique identifier for your application.
     * This should be a consistent UUID or random string.
     */
    clientId: string;
    /**
     * The name of your application/product
     * @default "Riven Media"
     */
    product?: string;
    /**
     * The version of your application
     * @default "1.0"
     */
    version?: string;
    /**
     * The platform your application runs on (e.g., "Web", "iOS", "Android")
     * @default "Web"
     */
    platform?: string;
    /**
     * The device name
     * @default "Browser"
     */
    device?: string;
    /**
     * Disable sign-up for new users via this provider
     */
    disableSignUp?: boolean;
}

interface PlexPinResponse {
    id: number;
    code: string;
    product: string;
    trusted: boolean;
    clientIdentifier: string;
    location: {
        code: string;
        country: string;
        city: string;
        subdivisions: string;
        coordinates: string;
    };
    expiresIn: number;
    createdAt: string;
    expiresAt: string;
    authToken: string | null;
    newRegistration: boolean | null;
    [key: string]: unknown;
}

/**
 * Gets the standard Plex API headers
 */
export function getPlexHeaders(
    options: PlexOAuthOptions,
    includeToken?: string
): Record<string, string> {
    const headers: Record<string, string> = {
        "X-Plex-Product": options.product || "Riven Media",
        "X-Plex-Version": options.version || "1.0",
        "X-Plex-Client-Identifier": options.clientId,
        "X-Plex-Platform": options.platform || "Web",
        "X-Plex-Device": options.device || "Browser",
        "Content-Type": "application/json",
        Accept: "application/json"
    };
    if (includeToken) {
        headers["X-Plex-Token"] = includeToken;
    }
    return headers;
}

/**
 * Generates a Plex PIN for authentication
 */
export async function generatePlexPin(options: PlexOAuthOptions): Promise<PlexPinResponse> {
    const response = await fetch("https://plex.tv/api/v2/pins", {
        method: "POST",
        headers: getPlexHeaders(options),
        body: JSON.stringify({
            strong: true
        })
    });

    if (!response.ok) {
        throw new Error("Failed to generate Plex PIN");
    }

    return response.json();
}

/**
 * Builds the Plex authorization URL with a PIN
 */
export function buildPlexAuthUrl(
    options: PlexOAuthOptions,
    pinCode: string,
    forwardUrl?: string
): URL {
    const product = options.product || "Riven Media";
    const version = options.version || "1.0";
    const platform = options.platform || "Web";
    const device = options.device || "Browser";

    const authURL = new URL("https://app.plex.tv/auth");
    authURL.hash = `?clientID=${encodeURIComponent(options.clientId)}&code=${encodeURIComponent(pinCode)}&context[device][product]=${encodeURIComponent(product)}&context[device][version]=${encodeURIComponent(version)}&context[device][platform]=${encodeURIComponent(platform)}&context[device][device]=${encodeURIComponent(device)}`;

    if (forwardUrl) {
        authURL.hash += `&forwardUrl=${encodeURIComponent(forwardUrl)}`;
    }

    return authURL;
}

/**
 * Checks the status of a Plex PIN and retrieves the auth token if available
 */
export async function checkPlexPin(
    options: PlexOAuthOptions,
    pinId: string,
    pinCode: string
): Promise<PlexPinResponse> {
    const response = await fetch(`https://plex.tv/api/v2/pins/${pinId}`, {
        method: "GET",
        headers: getPlexHeaders(options, pinCode)
    });

    if (!response.ok) {
        throw new Error("Failed to check PIN status");
    }

    return response.json();
}

/**
 * Fetches user profile from Plex API
 */
export async function getPlexUserProfile(
    options: PlexOAuthOptions,
    authToken: string
): Promise<PlexProfile> {
    const response = await fetch("https://plex.tv/api/v2/user", {
        method: "GET",
        headers: getPlexHeaders(options, authToken)
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch user info from Plex: ${response.status}`);
    }

    return response.json();
}

/**
 * Creates a Plex OAuth provider configuration for the Generic OAuth plugin.
 *
 * Note: Since Plex uses a non-standard PIN-based auth flow, this configuration
 * requires a custom sign-in endpoint that handles the PIN generation and
 * authorization URL building before redirecting the user.
 *
 * @example
 * ```ts
 * import { genericOAuth } from "better-auth/plugins";
 * import { plexOAuth } from "./plex-oauth";
 *
 * export const auth = betterAuth({
 *     plugins: [
 *         genericOAuth({
 *             config: [
 *                 plexOAuth({
 *                     clientId: "your-client-id",
 *                     product: "Your App Name",
 *                 }),
 *             ],
 *         }),
 *     ],
 * });
 * ```
 */
export function plexOAuth(options: PlexOAuthOptions & { baseURL?: string }): GenericOAuthConfig {
    if (!options.clientId) {
        throw new Error("Client ID is required for Plex OAuth provider");
    }

    // Use custom authorization endpoint that handles Plex PIN flow
    const baseURL = options.baseURL || "";

    return {
        providerId: "plex",
        clientId: options.clientId,
        // Plex doesn't use a client secret
        clientSecret: "not-used",
        // Point to our custom endpoint that handles the Plex PIN flow
        // This endpoint will generate a PIN, store state, and redirect to Plex
        authorizationUrl: `${baseURL}/api/plex/authorize`,
        // This won't be used but is required
        tokenUrl: "https://plex.tv/api/v2/pins",
        // Custom redirect URI to our Plex callback handler
        redirectURI: `${baseURL}/api/plex/callback`,
        scopes: [],
        disableSignUp: options.disableSignUp,

        // Custom token exchange for Plex's PIN-based flow
        // The code parameter is expected to be in format "pinId:pinCode"
        getToken: async ({ code }) => {
            const parts = code.split(":");
            if (parts.length < 2) {
                throw new Error("Invalid PIN code format, expected pinId:pinCode");
            }

            const pinId = parts[0];
            const pinCode = parts[1];

            const pinStatus = await checkPlexPin(options, pinId, pinCode);

            if (!pinStatus.authToken) {
                throw new Error("No auth token in PIN response - user may not have authorized");
            }

            return {
                accessToken: pinStatus.authToken,
                tokenType: "Bearer",
                accessTokenExpiresAt: undefined,
                refreshToken: undefined,
                scopes: [],
                raw: pinStatus
            };
        },

        // Custom user info fetcher for Plex
        getUserInfo: async (tokens) => {
            if (!tokens.accessToken) {
                return null;
            }

            try {
                const profile = await getPlexUserProfile(options, tokens.accessToken);

                return {
                    id: profile.id.toString(),
                    name: profile.title || profile.username,
                    email: profile.email,
                    image: profile.thumb,
                    emailVerified: profile.emailOnlyAuth
                };
            } catch (error) {
                console.error("Failed to fetch user info from Plex:", error);
                return null;
            }
        }
    };
}

/**
 * Default Plex options using environment variable
 */
export function getDefaultPlexOptions(env: Record<string, string | undefined>): PlexOAuthOptions {
    return {
        clientId: env.PLEX_CLIENT_ID || "riven",
        product: "Riven Media",
        version: "1.0",
        platform: "Web",
        device: "Browser",
        disableSignUp: env.ENABLE_PLEX_SIGNUP !== "true"
    };
}
