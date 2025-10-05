<script lang="ts">
    import { notificationStore } from "$lib/stores/notifications.svelte";
    import { onMount, onDestroy } from "svelte";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import Bell from "@lucide/svelte/icons/bell";
    import BellRing from "@lucide/svelte/icons/bell-ring";
    import Check from "@lucide/svelte/icons/check";
    import CheckCheck from "@lucide/svelte/icons/check-check";
    import X from "@lucide/svelte/icons/x";
    import { toast } from "svelte-sonner";

    let open = $state(false);

    onMount(() => {
        notificationStore.connect();
    });

    onDestroy(() => {
        notificationStore.disconnect();
    });

    function formatTimestamp(timestamp: string): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    function getTypeColor(type: string): string {
        switch (type) {
            case "movie":
                return "bg-blue-500/10 text-blue-500";
            case "show":
                return "bg-purple-500/10 text-purple-500";
            case "season":
                return "bg-green-500/10 text-green-500";
            case "episode":
                return "bg-orange-500/10 text-orange-500";
            default:
                return "bg-gray-500/10 text-gray-500";
        }
    }

    function handleMarkAsRead(id: string) {
        notificationStore.markAsRead(id);
    }

    function handleMarkAllAsRead() {
        notificationStore.markAllAsRead();
        toast.success("All notifications marked as read");
    }

    function handleClearAll() {
        notificationStore.clear();
        toast.success("All notifications cleared");
    }

    function handleRemove(id: string) {
        notificationStore.remove(id);
    }

    // Watch for new notifications and show toast
    $effect(() => {
        const notifications = notificationStore.notifications;
        if (notifications.length > 0 && !notifications[0].read) {
            const latest = notifications[0];
            toast.success(latest.title, {
                description: latest.message,
                duration: 5000
            });
        }
    });
</script>

<Popover.Root bind:open>
    <Popover.Trigger>
        {#snippet child({ props })}
            <Button variant="ghost" size="icon" class="relative h-9 w-9" {...props}>
                {#if notificationStore.unreadCount > 0}
                    <BellRing class="size-5" />
                    <Badge
                        class="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                        {notificationStore.unreadCount}
                    </Badge>
                {:else}
                    <Bell class="size-5" />
                {/if}
            </Button>
        {/snippet}
    </Popover.Trigger>
    <Popover.Content class="w-96 p-0" align="end">
        <div class="flex flex-col">
            <div class="flex items-center justify-between p-4 pb-3">
                <h3 class="text-sm font-semibold">Notifications</h3>
                <div class="flex items-center gap-2">
                    {#if notificationStore.unreadCount > 0}
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-7 px-2 text-xs"
                            onclick={handleMarkAllAsRead}>
                            <CheckCheck class="mr-1 size-3" />
                            Mark all read
                        </Button>
                    {/if}
                    {#if notificationStore.notifications.length > 0}
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-7 px-2 text-xs"
                            onclick={handleClearAll}>
                            <X class="mr-1 size-3" />
                            Clear all
                        </Button>
                    {/if}
                </div>
            </div>
            <Separator />

            <div class="max-h-[400px] overflow-y-auto">
                {#if notificationStore.notifications.length === 0}
                    <div class="flex flex-col items-center justify-center p-8 text-center">
                        <Bell class="text-muted-foreground/30 size-12" />
                        <p class="text-muted-foreground mt-2 text-sm">No notifications yet</p>
                        <p class="text-muted-foreground/70 mt-1 text-xs">
                            You'll be notified when items complete
                        </p>
                    </div>
                {:else}
                    {#each notificationStore.notifications as notification (notification.id)}
                        <div
                            class="border-border/50 hover:bg-muted/30 border-b p-3 transition-colors {!notification.read
                                ? 'bg-muted/10'
                                : ''}">
                            <div class="flex items-start justify-between gap-2">
                                <div class="flex-1 space-y-1">
                                    <div class="flex items-center gap-2">
                                        <Badge
                                            variant="secondary"
                                            class="{getTypeColor(notification.type)} text-[10px]">
                                            {notification.type}
                                        </Badge>
                                        {#if !notification.read}
                                            <div class="size-2 rounded-full bg-blue-500"></div>
                                        {/if}
                                    </div>
                                    <p class="text-sm leading-none font-medium">
                                        {notification.title}
                                    </p>
                                    <p class="text-muted-foreground text-xs">
                                        {notification.message}
                                    </p>
                                    <p class="text-muted-foreground/70 text-xs">
                                        {formatTimestamp(notification.timestamp)}
                                    </p>
                                </div>
                                <div class="flex flex-col gap-1">
                                    {#if !notification.read}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            class="size-6"
                                            onclick={() => handleMarkAsRead(notification.id)}>
                                            <Check class="size-3" />
                                        </Button>
                                    {/if}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="size-6"
                                        onclick={() => handleRemove(notification.id)}>
                                        <X class="size-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>

            {#if notificationStore.connectionStatus === "error"}
                <div class="border-destructive/20 bg-destructive/10 border-t p-3">
                    <p class="text-destructive text-xs">
                        Connection error. Notifications may be delayed.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        class="mt-2 h-6 text-xs"
                        onclick={() => notificationStore.reconnect()}>
                        Reconnect
                    </Button>
                </div>
            {/if}
        </div>
    </Popover.Content>
</Popover.Root>
