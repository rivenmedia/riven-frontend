<script lang="ts">
    import { type PageProps } from "./$types";
    import { Badge } from "$lib/components/ui/badge/index.js";
    import PortraitCard from "$lib/components/media/portrait-card.svelte";
    import { calculateAge, formatDate, isDayAndMonthToday } from "$lib/helpers";
    import ArrowRight from "@lucide/svelte/icons/arrow-right";
    import { cn, deduplicateById } from "$lib/utils";
    import PageShell from "$lib/components/page-shell.svelte";

    let { data }: PageProps = $props();

    const birthdayToday = isDayAndMonthToday(data.person.birthday);

    // Constants
    const GRID_CLASSES =
        "grid grid-cols-3 gap-4 min-[450px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9" as const;

    const CONFETTI_CONFIG = {
        colors: [
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
        ],
        shapes: ["square", "circle", "rectangle", ""] as const,
        animations: [
            "confetti-fall-1",
            "confetti-fall-2",
            "confetti-fall-3",
            "confetti-fall-4",
            "confetti-fall-5"
        ] as const
    };

    // Combine Cast and Crew for carousel
    const combinedCredits = [
        ...data.person.cast_credits.map((c) => ({
            id: c.id,
            title: c.title,
            backdrop_path: c.backdrop_path,
            vote_count: c.vote_count,
            release_date: c.release_date,
            vote_average: c.vote_average,
            media_type: c.media_type,
            role: "Acting" as const,
            character: c.character
        })),
        ...data.person.crew_credits.map((c) => ({
            id: c.id,
            title: c.title,
            backdrop_path: c.backdrop_path,
            vote_count: c.vote_count,
            release_date: c.release_date,
            vote_average: c.vote_average,
            media_type: c.media_type,
            role: c.job ?? "Crew",
            character: null as string | null
        }))
    ];

    const uniqueCredits = deduplicateById(combinedCredits);

    // Filter credits by type
    const movieCredits = data.person.cast_credits.filter((c) => c.media_type === "movie");
    const showCredits = data.person.cast_credits.filter((c) => c.media_type === "tv");
    const crewCredits = deduplicateById(
        data.person.crew_credits.map((c) => ({
            ...c,
            role: c.job ?? "Crew",
            character: null
        }))
    );

    // Select Top 5 for carousel (matching Seerr's logic)
    const backdropCandidates = uniqueCredits
        .filter((c) => c.backdrop_path)
        .sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0))
        .slice(0, 5);

    // Map to carousel format
    const carouselItems: TMDBNowPlayingItem[] = backdropCandidates.map((c) => ({
        id: c.id,
        media_type: c.media_type as "movie" | "tv",
        title: c.title,
        backdrop_path: c.backdrop_path,
        release_date: c.release_date ?? undefined,
        vote_average: c.vote_average ?? 0,
        overview: c.character ? `as ${c.character}` : c.role,
        genre_ids: []
    }));

    const currentBackdrop = carouselItems[0];

    function formatCreditSubtitle(credit: {
        character?: string | null;
        job?: string | null;
        year?: number | null;
    }): string | null {
        const role = credit.character ? `as ${credit.character}` : (credit.job ?? "");
        const yearSuffix = credit.year ? ` • ${credit.year}` : "";
        const result = `${role}${yearSuffix}`;
        return result || null;
    }
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

<div class="relative flex min-h-screen flex-col overflow-x-hidden">
    <!-- Birthday Confetti -->
    {#if birthdayToday && !data.person.deathday}
        <div class="pointer-events-none fixed inset-0 z-50 overflow-hidden">
            {#each Array(20) as _, i}
                <div
                    class="confetti {CONFETTI_CONFIG.shapes[i % CONFETTI_CONFIG.shapes.length]}"
                    style="
                left: {(i * 5.26) % 100}%;
                background: {CONFETTI_CONFIG.colors[i % CONFETTI_CONFIG.colors.length]};
                animation: {CONFETTI_CONFIG.animations[
                        i % CONFETTI_CONFIG.animations.length
                    ]} {2.5 + (i % 8) * 0.2}s linear infinite;
                animation-delay: {(i * 0.15) % 2}s;
                width: {8 + (i % 5)}px;
                height: {8 + ((i * 3) % 5)}px;
            ">
                </div>
            {/each}
        </div>
    {/if}

    <!-- Background -->
    {#if currentBackdrop?.backdrop_path}
        <div class="fixed top-0 left-0 z-0 h-screen w-full">
            <img
                alt=""
                class="animate-in fade-in zoom-in-105 h-full w-full object-cover opacity-30 blur-3xl transition-opacity duration-1000"
                src={currentBackdrop.backdrop_path} />
            <div class="bg-background/80 absolute inset-0 mix-blend-multiply"></div>
            <div
                class="from-background via-background/50 absolute inset-0 bg-gradient-to-t to-transparent">
            </div>
            <div
                class="from-background/20 absolute inset-0 bg-gradient-to-b via-transparent to-transparent">
            </div>
        </div>
    {:else if data.person.profile_path}
        <div class="fixed top-0 left-0 z-0 h-screen w-full">
            <img
                alt=""
                class="h-full w-full object-cover opacity-10 blur-3xl transition-opacity duration-1000"
                src={data.person.profile_path} />
            <div class="bg-background/50 absolute inset-0"></div>
        </div>
    {:else}
        <div class="fixed top-0 left-0 z-0 h-screen w-full">
            <div class="bg-background absolute inset-0"></div>
            <div
                class="bg-primary/10 absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full blur-[120px]">
            </div>
        </div>
    {/if}

    <!-- Main Content -->
    {#if carouselItems.length > 0}
        <div class="mb-6 px-2 md:mb-8 md:px-4">
            <TmdbNowPlaying
                data={carouselItems}
                alignment="right"
                showRequestButton={false}
                heightClass="h-[280px] sm:h-[320px] md:h-[420px]" />
        </div>
    {/if}

    <PageShell class="mt-0">
        <!-- Hero Content Area -->
        <div
            class={cn(
                "px-4 pb-6 md:px-8 md:pb-8 lg:px-12",
                carouselItems.length === 0 && "pt-24 md:pt-[20vh]"
            )}>
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr] lg:gap-8">
                <!-- Portrait Column (Desktop) -->
                <div class="relative hidden lg:mx-0 lg:block">
                    <PortraitCard
                        title={data.person.name}
                        image={data.person.profile_path}
                        class="group w-48 rounded-xl shadow-2xl transition-transform duration-500 hover:scale-105 lg:w-64"
                        showContent={false} />

                    {#if birthdayToday && !data.person.deathday}
                        <div
                            class="bg-primary absolute -top-3 -right-3 z-20 animate-bounce rounded-full p-2 shadow-lg">
                            <span class="text-xl">🎂</span>
                        </div>
                    {/if}
                </div>

                <!-- Content Column -->
                <div class="flex flex-col justify-end gap-5 pb-2">
                    <!-- Unified Content Wrapper -->
                    <div class="flex gap-4 lg:block">
                        <!-- Mobile Portrait (Hidden on Desktop) -->
                        <div class="relative flex-shrink-0 lg:hidden">
                            <PortraitCard
                                title={data.person.name}
                                image={data.person.profile_path}
                                class="group w-28 rounded-lg shadow-xl sm:w-32"
                                showContent={false} />
                            {#if birthdayToday && !data.person.deathday}
                                <div
                                    class="bg-primary absolute -top-2 -right-2 z-20 animate-bounce rounded-full p-2 shadow-lg">
                                    <span class="text-lg">🎂</span>
                                </div>
                            {/if}
                        </div>

                        <!-- Info Content -->
                        <div class="min-w-0 flex-1 space-y-2 lg:space-y-0">
                            <h1
                                class="text-foreground text-3xl font-black tracking-tight drop-shadow-md sm:text-4xl lg:text-7xl">
                                {data.person.name}
                            </h1>

                            <!-- Metadata Pills -->
                            <div class="flex flex-wrap items-center gap-2 lg:mt-4">
                                {@render metadataBadges()}
                            </div>

                            <!-- Also Known As -->
                            <div class="lg:mt-3">
                                {@render alsoKnownAs(
                                    "text-xs font-semibold uppercase tracking-wide lg:text-sm lg:normal-case lg:tracking-normal",
                                    "hidden lg:inline"
                                )}
                            </div>
                        </div>
                    </div>

                    <!-- Biography -->
                    {#if data.person.biography}
                        <div class="mt-2 max-w-4xl space-y-2">
                            <h3 class="text-foreground text-lg font-bold">Biography</h3>
                            <div class="relative">
                                <p
                                    class="text-muted-foreground line-clamp-4 text-base leading-relaxed">
                                    {data.person.biography}
                                </p>
                                {#if data.person.biography.length > 300 && data.person.imdb_id}
                                    <a
                                        href="https://www.imdb.com/name/{data.person.imdb_id}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="text-primary hover:text-primary/80 mt-1 flex items-center gap-1 text-xs font-bold">
                                        Read More on IMDb
                                        <ArrowRight
                                            size={12}
                                            class="transition-transform duration-300" />
                                    </a>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <div class="px-4 md:px-12 lg:px-20 xl:px-24">
            <div class="bg-border/20 my-6 h-px w-full"></div>
        </div>

        <!-- Credits -->
        <div class="flex flex-col gap-20 px-4 pb-20 md:px-12 lg:px-20 xl:px-24">
            {@render creditsSection("Movies", movieCredits)}
            {@render creditsSection("TV Shows", showCredits)}
            {@render creditsSection("Crew", crewCredits)}
        </div>
    </PageShell>
</div>

{#snippet creditsSection(title: string, credits: typeof movieCredits)}
    {#if credits.length > 0}
        <section>
            <div class="mb-6 flex items-baseline gap-3">
                <h2 class="text-foreground text-3xl font-bold tracking-tight">{title}</h2>
                <span class="text-muted-foreground text-lg font-medium">({credits.length})</span>
            </div>
            <div class={GRID_CLASSES}>
                {@render creditList(credits)}
            </div>
        </section>
    {/if}
{/snippet}

{#snippet creditList(credits: typeof movieCredits)}
    {#each credits as credit, index (`${credit.id}-${index}`)}
        <a
            href="/details/media/{credit.id}/{credit.media_type}"
            class="group relative block opacity-80 transition-all duration-300 hover:scale-105 hover:opacity-100">
            <PortraitCard
                title={credit.title}
                subtitle={formatCreditSubtitle(credit)}
                image={credit.poster_path ?? null}
                class="w-full" />
        </a>
    {/each}
{/snippet}

{#snippet metadataBadges()}
    {#if data.person.known_for_department}
        <Badge
            variant="outline"
            class="border-border/50 text-muted-foreground hover:text-foreground bg-black/40 px-3 py-1 text-sm font-medium backdrop-blur-md transition-colors hover:bg-black/60">
            {data.person.known_for_department}
        </Badge>
    {/if}
    {#if data.person.gender}
        <Badge
            variant="outline"
            class="border-border/50 text-muted-foreground hover:text-foreground bg-black/40 px-3 py-1 text-sm font-medium backdrop-blur-md transition-colors hover:bg-black/60">
            {data.person.gender}
        </Badge>
    {/if}
    {#if data.person.birthday}
        <Badge
            variant="outline"
            class="border-border/50 text-muted-foreground hover:text-foreground bg-black/40 px-3 py-1 text-sm font-medium backdrop-blur-md transition-colors hover:bg-black/60">
            {formatDate(data.person.birthday)}
            {#if !data.person.deathday}
                • {calculateAge(data.person.birthday)} y/o{/if}
        </Badge>
    {/if}
    {#if data.person.place_of_birth}
        <Badge
            variant="outline"
            class="border-border/50 text-muted-foreground hover:text-foreground bg-black/40 px-3 py-1 text-sm font-medium backdrop-blur-md transition-colors hover:bg-black/60">
            {data.person.place_of_birth}
        </Badge>
    {/if}
{/snippet}

{#snippet alsoKnownAs(titleClass = "text-sm font-semibold", colonClass = "")}
    {#if data.person.also_known_as.length > 0}
        <div class="space-y-1">
            <h3 class="text-muted-foreground {titleClass}">
                Also known as<span class={colonClass}>:</span>
            </h3>
            <div class="flex flex-wrap gap-2">
                {#each data.person.also_known_as as alias}
                    <Badge
                        variant="outline"
                        class="border-border/50 text-muted-foreground hover:text-foreground bg-black/40 px-3 py-1 text-sm font-medium backdrop-blur-md transition-colors hover:bg-black/60">
                        {alias}
                    </Badge>
                {/each}
            </div>
        </div>
    {/if}
{/snippet}
