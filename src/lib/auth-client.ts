import { createAuthClient } from "better-auth/svelte";
import {
    passkeyClient,
    usernameClient,
    adminClient,
    lastLoginMethodClient
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [usernameClient(), adminClient(), passkeyClient(), lastLoginMethodClient()]
});
export const { signIn, signUp, useSession } = authClient;
