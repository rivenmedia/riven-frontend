/**
 * Configuration for a generic OAuth provider.
 * These are parsed from environment variables in the format:
 * OAUTH_PROVIDER_{PROVIDER_NAME}_{CONFIG_KEY}
 *
 * Example environment variables:
 * - OAUTH_PROVIDER_GOOGLE_CLIENT_ID=your-client-id
 * - OAUTH_PROVIDER_GOOGLE_CLIENT_SECRET=your-client-secret
 * - OAUTH_PROVIDER_GOOGLE_DISCOVERY_URL=https://accounts.google.com/.well-known/openid-configuration
 * - OAUTH_PROVIDER_GOOGLE_SCOPES=openid,email,profile
 * - OAUTH_PROVIDER_GOOGLE_PKCE=true
 * - OAUTH_PROVIDER_GOOGLE_NAME=Google
 * - OAUTH_PROVIDER_GOOGLE_ICON=https://example.com/google-icon.svg
 *
 * Or using ISSUER for auto-discovery:
 * - OAUTH_PROVIDER_KEYCLOAK_ISSUER=https://auth.example.com/realms/myrealm
 */
export interface GenericOAuthProvider {
    /** Unique identifier for this provider (derived from env var name, lowercase) */
    providerId: string;
    /** OpenID Connect discovery URL. If not set, can be derived from ISSUER */
    discoveryUrl?: string;
    /** OAuth client ID */
    clientId: string;
    /** OAuth client secret */
    clientSecret: string;
    /** OAuth scopes to request (comma-separated in env var) */
    scopes?: string[];
    /** Enable PKCE for enhanced security */
    pkce?: boolean;
    /** Disable sign-up for new users via this provider */
    disableSignUp?: boolean;
    /** Custom redirect URI (defaults to ${baseURL}/api/auth/oauth2/callback/${providerId}) */
    redirectURI?: string;
    /** Authorization endpoint URL (not needed if using discoveryUrl) */
    authorizationUrl?: string;
    /** Token endpoint URL (not needed if using discoveryUrl) */
    tokenUrl?: string;
    /** User info endpoint URL (not needed if using discoveryUrl) */
    userInfoUrl?: string;
    /** Display name for the provider */
    name?: string;
    /** Icon URL for the provider */
    icon?: string;
}

interface NestedObject {
    [key: string]: NestedObject | string | undefined;
}

function unflattenObject(data: Record<string, string | undefined>, delimiter = "_"): NestedObject {
    const result: NestedObject = {};
    for (const key in data) {
        if (!key.startsWith("OAUTH_PROVIDER_")) continue;

        const value = data[key];
        if (value === undefined) continue;

        const parts = key.split(delimiter);
        let current = result;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                current[part] = value;
            } else {
                current[part] = current[part] || {};
                current = current[part] as NestedObject;
            }
        }
    }
    return result;
}

export function getGenericOAuthProviders(
    env: Record<string, string | undefined>
): GenericOAuthProvider[] {
    const root = unflattenObject(env);

    // config.OAUTH.PROVIDER.[PROVIDER_NAME]
    const oauth = root["OAUTH"] as NestedObject | undefined;
    const providersObj = oauth?.["PROVIDER"] as NestedObject | undefined;

    if (!providersObj) {
        return [];
    }

    const providers: GenericOAuthProvider[] = [];

    for (const providerNameUpper in providersObj) {
        const config = providersObj[providerNameUpper] as NestedObject;
        if (typeof config !== "object") continue;

        const providerId = providerNameUpper.toLowerCase();

        // Skip if it somehow picked up non-provider keys (unlikely with the structure)

        // Parse fields
        // OAUTH_PROVIDER_GOOGLE_CLIENT_ID -> GOOGLE -> CLIENT -> ID

        const clientObj = config["CLIENT"] as NestedObject | undefined;
        const clientId = clientObj?.["ID"] as string | undefined;
        const clientSecret = clientObj?.["SECRET"] as string | undefined;

        if (clientId && clientSecret) {
            providers.push({
                providerId,
                clientId,
                clientSecret,
                discoveryUrl:
                    ((config["DISCOVERY"] as NestedObject)?.["URL"] as string | undefined) ??
                    ((config["ISSUER"] as string)
                        ? `${config["ISSUER"]}/.well-known/openid-configuration`
                        : undefined),
                scopes: (config["SCOPES"] as string)?.split(",").map((s) => s.trim()),
                pkce: (config["PKCE"] as string) === "true",
                disableSignUp:
                    ((config["DISABLE"] as NestedObject)?.["SIGNUP"] as string) === "true",
                redirectURI: (config["REDIRECT"] as NestedObject)?.["URI"] as string | undefined,
                authorizationUrl:
                    ((config["AUTHORIZATION"] as NestedObject)?.["URL"] as string | undefined) ??
                    ((config["AUTH"] as NestedObject)?.["URL"] as string | undefined),
                tokenUrl: (config["TOKEN"] as NestedObject)?.["URL"] as string | undefined,
                userInfoUrl:
                    ((config["USERINFO"] as NestedObject)?.["URL"] as string | undefined) ??
                    (((config["USER"] as NestedObject)?.["INFO"] as NestedObject)?.["URL"] as
                        | string
                        | undefined),
                name:
                    (config["NAME"] as string) ||
                    providerId.charAt(0).toUpperCase() + providerId.slice(1),
                icon: config["ICON"] as string
            });
        }
    }

    return providers;
}
