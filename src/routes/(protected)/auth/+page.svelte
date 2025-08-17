<script lang="ts">
    import type { PageProps } from "./$types";
    import { authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components/ui/button/index.js";

    let { data }: PageProps = $props();
    $inspect(data);

    /*
    Table Name: user
    Field Name	Type	Key	Description
    id	string	
    Unique identifier for each user
    name	string	-	User's chosen display name
    email	string	-	User's email address for communication and login
    emailVerified	boolean	-	Whether the user's email is verified
    image	string	
    User's image url
    createdAt	Date	-	Timestamp of when the user account was created
    updatedAt	Date	-	Timestamp of the last update to the user's information
    Session

    Table Name: session
    Field Name	Type	Key	Description
    id	string	
    Unique identifier for each session
    userId	string	
    The ID of the user
    token	string	-	The unique session token
    expiresAt	Date	-	The time when the session expires
    ipAddress	string	
    The IP address of the device
    userAgent	string	
    The user agent information of the device
    createdAt	Date	-	Timestamp of when the session was created
    updatedAt	Date	-	Timestamp of when the session was updated
    */

    // data has user and session
</script>

<div class="flex h-full flex-col p-6 md:p-8 md:px-16">
    <h1 class="text-3xl font-bold tracking-tight">{data.user.username}'s Profile</h1>

    <div class="mt-4 flex flex-col gap-4">
        <div class="flex flex-row items-center gap-4">
            <img
                src={data.user.image || "https://avatar.iran.liara.run/public"}
                alt={data.user.username}
                class="h-16 w-16 rounded-full object-cover" />
            <div>
                <p class="text-lg font-semibold">{data.user.name}</p>
                <p class="text-muted-foreground text-sm">{data.user.email}</p>
            </div>
        </div>

        <div class="flex flex-col">
            <p class="text-muted-foreground text-sm">
                Member since {new Date(data.user.createdAt).toLocaleDateString()}
            </p>

            <p class="text-muted-foreground text-sm">
                Last updated {new Date(data.user.updatedAt).toLocaleDateString()}
            </p>

            <p class="text-muted-foreground text-sm">
                Session expires at {new Date(data.session.expiresAt).toLocaleDateString()}
            </p>
        </div>
    </div>

    <div class="mt-4 flex flex-col">
        <Button
            variant="destructive"
            class="w-full md:max-w-max"
            onclick={async () => {
                await authClient.signOut({
                    fetchOptions: {
                        onSuccess: () => {
                            goto("/auth/login");
                        }
                    }
                });
            }}>
            Logout
        </Button>
    </div>
</div>
