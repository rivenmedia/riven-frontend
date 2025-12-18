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

export function getGenericOAuthProviders(env: Record<string, string | undefined>): GenericOAuthProvider[] {
    const providers: Record<string, GenericOAuthProvider> = {};

    for (const key of Object.keys(env)) {
        const match = key.match(/^OAUTH_PROVIDER_([A-Z0-9_]+)_CLIENT_ID$/);
        if (match) {
            const providerNameUpper = match[1];
            const providerId = providerNameUpper.toLowerCase();

            // We found a Client ID, let's look for other related vars
            const clientId = env[key];
            const clientSecret = env[`OAUTH_PROVIDER_${providerNameUpper}_CLIENT_SECRET`];

            if (clientId && clientSecret) {
                providers[providerId] = {
                    providerId,
                    clientId,
                    clientSecret,
                    discoveryUrl: env[`OAUTH_PROVIDER_${providerNameUpper}_DISCOVERY_URL`]
                        ?? (env[`OAUTH_PROVIDER_${providerNameUpper}_ISSUER`]
                            ? `${env[`OAUTH_PROVIDER_${providerNameUpper}_ISSUER`]}/.well-known/openid-configuration`
                            : undefined),
                    scopes: env[`OAUTH_PROVIDER_${providerNameUpper}_SCOPES`]?.split(','),
                    pkce: env[`OAUTH_PROVIDER_${providerNameUpper}_PKCE`] === 'true',
                    disableSignUp: env[`OAUTH_PROVIDER_${providerNameUpper}_DISABLE_SIGNUP`] === 'true',
                    redirectURI: env[`OAUTH_PROVIDER_${providerNameUpper}_REDIRECT_URI`],
                    authUrl: env[`OAUTH_PROVIDER_${providerNameUpper}_AUTH_URL`],
                    tokenUrl: env[`OAUTH_PROVIDER_${providerNameUpper}_TOKEN_URL`],
                    userInfoUrl: env[`OAUTH_PROVIDER_${providerNameUpper}_USER_INFO_URL`],
                    name: env[`OAUTH_PROVIDER_${providerNameUpper}_NAME`] || providerId,
                    icon: env[`OAUTH_PROVIDER_${providerNameUpper}_ICON`],
                };
            }
        }
    }

    return Object.values(providers);
}