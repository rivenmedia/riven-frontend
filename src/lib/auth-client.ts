import { createAuthClient } from "better-auth/svelte";
import { passkeyClient, usernameClient } from "better-auth/client/plugins";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [usernameClient(), adminClient(), passkeyClient()]
});
export const { signIn, signUp, useSession } = authClient;
