<script lang="ts">
    import { type PageProps } from "./$types";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import Mountain from "@lucide/svelte/icons/mountain";
    import PortraitCard from "$lib/components/media/portrait-card.svelte";
    import { calculateAge, formatDate, isDayAndMonthToday } from "$lib/helpers";

    let { data }: PageProps = $props();
    let selectedTab = $state<"acting" | "crew">("acting");

    const birthdayToday = isDayAndMonthToday(data.person.birthday);
    const memorialToday = isDayAndMonthToday(data.person.deathday);

    // Random colors for confetti
    const colors = [
        "#ff6b6b",
        "#4ecdc4",
        "#ffe66d",
        "#a8e6cf",
        "#ff8b94",
        "#ffd3b6",
        "#dcedc1",
        "#a8dadc",
        "#f1c0e8",
        "#cfbaf0",
        "#95e1d3",
        "#f38181"
    ];
    const shapes = ["square", "circle", "rectangle", ""];
    const animations = [
        "confetti-fall-1",
        "confetti-fall-2",
        "confetti-fall-3",
        "confetti-fall-4",
        "confetti-fall-5"
    ];
</script>

<svelte:head>
    <title>{data.person.name} - Riven</title>

    {#if birthdayToday && !data.person.deathday}
        <style>
            @keyframes confetti-fall-1 {
                0% {
                    transform: translateY(-100vh) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) translateX(30px) rotate(720deg);
                    opacity: 0;
                }
            }
            @keyframes confetti-fall-2 {
                0% {
                    transform: translateY(-100vh) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) translateX(-40px) rotate(-540deg);
                    opacity: 0;
                }
            }
            @keyframes confetti-fall-3 {
                0% {
                    transform: translateY(-100vh) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) translateX(50px) rotate(900deg);
                    opacity: 0;
                }
            }
            @keyframes confetti-fall-4 {
                0% {
                    transform: translateY(-100vh) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) translateX(-25px) rotate(-720deg);
                    opacity: 0;
                }
            }
            @keyframes confetti-fall-5 {
                0% {
                    transform: translateY(-100vh) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) translateX(15px) rotate(600deg);
                    opacity: 0;
                }
            }
            .confetti {
                position: fixed;
                z-index: 9999;
                pointer-events: none;
                border-radius: 2px;
                opacity: 0;
            }
            .confetti.square {
                border-radius: 0;
            }
            .confetti.circle {
                border-radius: 50%;
            }
            .confetti.rectangle {
                width: 8px;
                height: 12px;
            }
        </style>
    {/if}
</svelte:head>

<div class="relative flex flex-col">
    {#if birthdayToday && !data.person.deathday}
        <div class="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {#each Array(20) as _, i}
                <div
                    class="confetti {shapes[i % shapes.length]}"
                    style="
                left: {(i * 5.26) % 100}%;
                background: {colors[i % colors.length]};
                animation: {animations[i % animations.length]} {2.5 +
                        (i % 8) * 0.2}s linear infinite;
                animation-delay: {(i * 0.15) % 2}s;
                width: {8 + (i % 5)}px;
                height: {8 + ((i * 3) % 5)}px;
            ">
                </div>
            {/each}
        </div>
    {/if}

    <div class="fixed bottom-0 left-0 z-1 h-screen w-full">
        <div class="bg-background/70 absolute inset-0"></div>
        <div class="to-background absolute inset-0 bg-linear-to-b from-transparent"></div>
    </div>

    <div class="z-1 mt-14 flex h-full w-full flex-col p-8 md:px-16">
        <div class="md:px-8 lg:px-16">
            {#if birthdayToday && !data.person.deathday}
                <div
                    class="animate-in fade-in slide-in-from-top-4 mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-6 py-4 shadow-lg backdrop-blur-md">
                    <div class="flex items-center gap-3">
                        <span class="animate-bounce text-3xl">🎂</span>
                        <div>
                            <h2 class="text-lg font-bold text-yellow-200">
                                Happy Birthday, {data.person.name}!
                            </h2>
                            <p class="text-sm text-yellow-200/80">
                                Celebrating {calculateAge(data.person.birthday)} years today!
                            </p>
                        </div>
                    </div>
                </div>
            {/if}

            {#if memorialToday}
                <div
                    class="animate-in fade-in slide-in-from-top-4 mb-6 rounded-lg border border-purple-500/30 bg-purple-900/20 px-6 py-4 shadow-lg backdrop-blur-md">
                    <div class="flex items-center gap-3">
                        <span class="text-3xl">🕯️</span>
                        <div>
                            <h2 class="text-lg font-bold text-purple-200">In Loving Memory</h2>
                            <p class="text-sm text-purple-200/80">
                                Remembering {data.person.name} on this day. Their legacy continues to
                                inspire.
                            </p>
                        </div>
                    </div>
                </div>
            {/if}

            <div
                class="border-border/50 bg-background/60 mt-6 flex flex-col rounded-xl border px-6 py-6 shadow-lg backdrop-blur-md md:flex-row">
                <div class="mb-6 flex justify-center md:mr-6 md:mb-0 md:justify-start">
                    {#if data.person.profile_path}
                        <img
                            alt={data.person.name}
                            class="h-64 w-48 rounded-lg object-cover shadow-md hover:scale-105 md:h-80 md:w-56 lg:h-96 lg:w-64"
                            src={data.person.profile_path}
                            loading="lazy" />
                    {:else}
                        <div
                            class="border-border bg-muted flex h-64 w-48 items-center justify-center rounded-lg border shadow-md backdrop-blur-md md:h-80 md:w-56 lg:h-96 lg:w-64">
                            <Mountain size={48} class="opacity-50" />
                        </div>
                    {/if}
                </div>

                <div class="flex flex-1 flex-col">
                    <div class="mb-4 flex flex-wrap items-center gap-2">
                        <h1 class="text-2xl font-bold drop-shadow-md md:text-3xl">
                            {data.person.name}
                        </h1>
                        {#if birthdayToday && !data.person.deathday}<span
                                class="animate-bounce text-2xl"
                                title="Birthday Today!">🎉</span
                            >{/if}
                    </div>

                    <div class="mb-4 flex flex-wrap gap-2">
                        {#if data.person.known_for_department}<Badge variant="outline"
                                >{data.person.known_for_department}</Badge
                            >{/if}
                        {#if data.person.gender}<Badge variant="outline">{data.person.gender}</Badge
                            >{/if}
                        {#if birthdayToday && !data.person.deathday}<Badge
                                class="bg-yellow-500/80 text-yellow-950 hover:bg-yellow-500"
                                >🎂 Birthday Today!</Badge
                            >{/if}
                    </div>

                    <div class="mb-4 flex flex-col gap-2">
                        {#if data.person.birthday}
                            <div class="flex flex-col gap-1">
                                <p class="text-muted-foreground text-xs font-semibold">Born</p>
                                <p class="text-sm">
                                    {formatDate(data.person.birthday)}{#if !data.person.deathday}
                                        (age {calculateAge(data.person.birthday)}){/if}
                                </p>
                            </div>
                        {/if}
                        {#if data.person.deathday}
                            <div class="flex flex-col gap-1">
                                <p class="text-muted-foreground text-xs font-semibold">Died</p>
                                <p class="text-sm">
                                    {formatDate(data.person.deathday)} (age {calculateAge(
                                        data.person.birthday,
                                        data.person.deathday
                                    )})
                                </p>
                            </div>
                        {/if}
                        {#if data.person.place_of_birth}
                            <div class="flex flex-col gap-1">
                                <p class="text-muted-foreground text-xs font-semibold">
                                    Place of Birth
                                </p>
                                <p class="text-sm">{data.person.place_of_birth}</p>
                            </div>
                        {/if}
                        {#if data.person.also_known_as?.length}
                            <div class="flex flex-col gap-1">
                                <p class="text-muted-foreground text-xs font-semibold">
                                    Also Known As
                                </p>
                                <p class="text-sm">{data.person.also_known_as.join(", ")}</p>
                            </div>
                        {/if}
                        {#if data.person.imdb_id}
                            <div class="flex flex-col gap-1">
                                <p class="text-muted-foreground text-xs font-semibold">
                                    External Links
                                </p>
                                <a
                                    href="https://www.imdb.com/name/{data.person.imdb_id}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="text-sm font-medium underline hover:opacity-80">IMDb</a>
                            </div>
                        {/if}
                    </div>

                    {#if data.person.biography}
                        <div class="flex flex-col gap-2">
                            <h2 class="text-base font-semibold">Biography</h2>
                            <p class="text-sm leading-relaxed">{data.person.biography}</p>
                        </div>
                    {/if}
                </div>
            </div>

            <section class="mt-8">
                <div class="mb-4 flex gap-4">
                    <button
                        onclick={() => (selectedTab = "acting")}
                        class="text-lg font-bold drop-shadow-md transition-opacity {selectedTab ===
                        'acting'
                            ? 'opacity-100'
                            : 'opacity-50 hover:opacity-75'}"
                        >Acting ({data.person.cast_credits.length})</button>
                    <button
                        onclick={() => (selectedTab = "crew")}
                        class="text-lg font-bold drop-shadow-md transition-opacity {selectedTab ===
                        'crew'
                            ? 'opacity-100'
                            : 'opacity-50 hover:opacity-75'}"
                        >Crew ({data.person.crew_credits.length})</button>
                </div>

                <div class="flex flex-wrap gap-4">
                    {#if selectedTab === "acting"}
                        {@render creditList(data.person.cast_credits)}
                    {:else}
                        {@render creditList(data.person.crew_credits)}
                    {/if}
                </div>
            </section>
        </div>
    </div>
</div>

{#snippet creditList(
    credits: Array<{
        id: number;
        title: string;
        character?: string | null;
        job?: string | null;
        year?: number;
        poster_path?: string | null;
        media_type: string;
    }>
)}
    {#each credits as credit (credit.id + (credit.character ?? credit.job ?? ""))}
        <a
            href="/details/media/{credit.id}/{credit.media_type}"
            class="group relative block opacity-80 transition-all hover:opacity-100">
            <PortraitCard
                title={credit.title}
                subtitle={`${credit.character ? `as ${credit.character}` : (credit.job ?? "")}${credit.year ? ` • ${credit.year}` : ""}` ||
                    null}
                image={credit.poster_path ?? null} />
        </a>
    {/each}
{/snippet}
