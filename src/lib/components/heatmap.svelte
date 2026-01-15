<script lang="ts">
    /*
    Adapted from: svelte5-heatmap
    Source: https://github.com/FelipeIzolan/svelte5-heatmap
    License: MIT
    Author: Felipe Izolan 
    */

    import { getCalendar, getColor } from "$lib/helpers";
    import type { MouseEventHandler, FocusEventHandler } from "svelte/elements";

    type Props = {
        data: { [key: string]: number };
        year?: number;
        lday?: boolean;
        lmonth?: boolean;
        colors?: string[];
        class?: string;

        onclick?: MouseEventHandler<HTMLTableCellElement>;
        onmouseout?: MouseEventHandler<HTMLTableCellElement>;
        onmouseover?: MouseEventHandler<HTMLTableCellElement>;
        onfocus?: FocusEventHandler<HTMLTableCellElement>;
        onblur?: FocusEventHandler<HTMLTableCellElement>;
    };

    let {
        data,
        onclick,
        onmouseout,
        onmouseover,
        onfocus,
        onblur,
        colors = ["#eff2f5", "#aceebb", "#4ac26b", "#2da44e", "#116329"],
        class: className = "Heatmap",
        year = new Date().getFullYear(),
        lday = true,
        lmonth = true
    }: Props = $props();

    let { max, calendar } = $derived(getCalendar(data, year));
</script>

<table class={className} style="font-size:1em">
    {#if lmonth}
        <thead>
            <tr class="text-[0.75em]">
                <td class="pb-[0.5em]"></td>
                <td colspan="5">Jan</td>
                <td colspan="4">Feb</td>
                <td colspan="4">Mar</td>
                <td colspan="5">Apr</td>
                <td colspan="4">May</td>
                <td colspan="4">Jun</td>
                <td colspan="5">Jul</td>
                <td colspan="4">Aug</td>
                <td colspan="4">Sep</td>
                <td colspan="5">Oct</td>
                <td colspan="4">Nov</td>
                <td colspan="4">Dec</td>
            </tr>
        </thead>
    {/if}
    <tbody>
        {#each calendar as w, i (i)}
            <tr>
                {#if lday}
                    <td class="pr-[0.5em] text-[0.75em]">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                    </td>
                {/if}
                {#each w as d, j (d ? d.date : `${i}-${j}`)}
                    {#if d}
                        <td
                            class="border-muted-foreground/10 h-[1em] w-[1em] border"
                            style="background:{getColor(colors, max, d.value)}"
                            data-date={d.date}
                            data-value={d.value}
                            title="{d.date}: {d.value} item{d.value !== 1 ? 's' : ''}"
                            {onfocus}
                            {onblur}
                            {onclick}
                            {onmouseout}
                            {onmouseover}></td>
                    {:else}
                        <td></td>
                    {/if}
                {/each}
            </tr>
        {/each}
    </tbody>
</table>
