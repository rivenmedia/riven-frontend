<script lang="ts">
    import CalendarIcon from "@lucide/svelte/icons/calendar";
    import { parseDate, type DateValue, CalendarDate } from "@internationalized/date";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import { Calendar } from "$lib/components/ui/calendar/index.js";
    import { Button } from "$lib/components/ui/button/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { cn } from "$lib/utils.js";

    let { value = $bindable(""), placeholder = "YYYY-MM-DD" } = $props();

    let internalValue = $state<DateValue | undefined>(undefined);

    // Sync from internal calendar state to string value
    function handleCalendarSelect(v: DateValue | undefined) {
        if (v) {
            value = v.toString(); // YYYY-MM-DD
        } else {
            value = "";
        }
    }

    // Sync from string value (prop or input) to internal calendar state
    $effect(() => {
        if (value) {
            try {
                internalValue = parseDate(value);
            } catch (e) {
                // Invalid date string, don't update calendar
            }
        } else {
            internalValue = undefined;
        }
    });

    function getDaysInMonth(year: number, month: number) {
        return new Date(year, month, 0).getDate();
    }

    function handleInput(e: Event) {
        const input = e.target as HTMLInputElement;
        let raw = input.value.replace(/\D/g, "");

        // Enforce month/day validity on each keystroke
        if (raw.length >= 5) {
            const m = parseInt(raw.slice(4, 6));
            if (raw.length === 5 && parseInt(raw[4]) > 1) raw = raw.slice(0, 4);
            else if (m === 0 || m > 12) raw = raw.slice(0, 5);
        }

        if (raw.length >= 7) {
            const y = parseInt(raw.slice(0, 4));
            const m = parseInt(raw.slice(4, 6));
            const d = parseInt(raw.slice(6, 8));
            const maxD = getDaysInMonth(y, m);

            if (raw.length === 7 && parseInt(raw[6]) > Math.floor(maxD / 10)) raw = raw.slice(0, 6);
            else if (d === 0 || d > maxD) raw = raw.slice(0, 7);
        }

        // Format to YYYY-MM-DD
        const formatted = [raw.slice(0, 4), raw.slice(4, 6), raw.slice(6, 8)]
            .filter(Boolean)
            .join("-");

        value = formatted;
        input.value = formatted;
    }
</script>

<div class={cn("flex w-full items-center gap-2")}>
    <div class="relative flex-1">
        <!-- Ghost text for "YYYY-MM-DD" mask. Only show when user is typing (value exists) to avoid overlap with placeholder -->
        {#if value && value.length < 10}
            <div
                class="pointer-events-none absolute inset-0 flex items-center px-3 font-mono text-sm tracking-normal">
                <span class="opacity-0">{value ?? ""}</span>
                <span class="text-muted-foreground/50"
                    >{"YYYY-MM-DD".slice(value?.length ?? 0)}</span>
            </div>
        {/if}
        <Input
            type="text"
            bind:value
            oninput={handleInput}
            class="relative z-10 w-full bg-transparent font-mono text-sm"
            maxlength={10}
            {placeholder} />
    </div>
    <Popover.Root>
        <Popover.Trigger>
            {#snippet child({ props })}
                <Button
                    variant="outline"
                    size="icon"
                    class={cn("aspect-square size-10", !value && "text-muted-foreground")}
                    {...props}>
                    <CalendarIcon class="size-4" />
                </Button>
            {/snippet}
        </Popover.Trigger>
        <Popover.Content class="w-auto p-0" align="end">
            <Calendar
                value={internalValue}
                onValueChange={handleCalendarSelect}
                type="single"
                initialFocus
                captionLayout="dropdown"
                minValue={new CalendarDate(1900, 1, 1)}
                maxValue={new CalendarDate(2100, 12, 31)} />
        </Popover.Content>
    </Popover.Root>
</div>
