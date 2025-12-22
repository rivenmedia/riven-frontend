import { createAuthClient } from "better-auth/svelte";
import {
    usernameClient,
    adminClient,
    lastLoginMethodClient,
    genericOAuthClient
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
    plugins: [
        usernameClient(),
        adminClient(),
        passkeyClient(),
        lastLoginMethodClient(),
        genericOAuthClient()
    ]
});
export const { signIn, signUp, useSession } = authClient;
