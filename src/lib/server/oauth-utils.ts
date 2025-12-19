export interface GenericOAuthProvider {
    providerId: string;
    discoveryUrl?: string;
    clientId: string;
    clientSecret: string;
    scopes?: string[];
    pkce?: boolean;
    disableSignUp?: boolean;
    redirectURI?: string;
    authUrl?: string;
    tokenUrl?: string;
    userInfoUrl?: string;
    name?: string;
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

export function getGenericOAuthProviders(env: Record<string, string | undefined>): GenericOAuthProvider[] {
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
        if (typeof config !== 'object') continue;

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
                discoveryUrl: (config["DISCOVERY"] as NestedObject)?.["URL"] as string | undefined
                    ?? ((config["ISSUER"] as string)
                        ? `${config["ISSUER"]}/.well-known/openid-configuration`
                        : undefined),
                scopes: (config["SCOPES"] as string)?.split(','),
                pkce: (config["PKCE"] as string) === 'true',
                disableSignUp: ((config["DISABLE"] as NestedObject)?.["SIGNUP"] as string) === 'true',
                redirectURI: (config["REDIRECT"] as NestedObject)?.["URI"] as string | undefined,
                authUrl: (config["AUTH"] as NestedObject)?.["URL"] as string | undefined,
                tokenUrl: (config["TOKEN"] as NestedObject)?.["URL"] as string | undefined,
                userInfoUrl: (config["USER"] as NestedObject)?.["INFO"] as NestedObject | undefined
                    ? ((config["USER"] as NestedObject)["INFO"] as NestedObject)["URL"] as string
                    : undefined,
                name: config["NAME"] as string || config["name"] as string || providerId,
                icon: config["ICON"] as string || config["icon"] as string,
            });
        }
    }

    return providers;
}