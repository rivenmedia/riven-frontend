<script lang="ts">
    import { AspectRatio } from '$lib/components/ui/aspect-ratio/index.js';
    import { cn } from '$lib/utils';
    import { Button } from '$lib/components/ui/button/index.js';
    import Circle from '@lucide/svelte/icons/circle';
    import Star from '@lucide/svelte/icons/star';
    import { roundOff } from '$lib/helpers';

    let touched = $state(false);

    function handleTouch() {
        touched = true;
        setTimeout(() => {
            touched = false;
        }, 100);
    }

    let {
        orientation,
        item,
        class: className = '',
        selectable = false,
        ...restProps
    }: {
        orientation: string;
        item: any;
        class?: string;
        selectable?: boolean;
    } = $props();

    const imagePath =
        orientation === 'horizontal'
            ? `https://www.themoviedb.org/t/p/w780${item.backdrop_path}`
            : `https://www.themoviedb.org/t/p/w342${item.poster_path}`;
</script>

<AspectRatio
    ratio={orientation === 'horizontal' ? 2 / 1 : 2 / 3}
    class={cn('group relative block w-full overflow-hidden rounded-md', className)}
    ontouchstart={handleTouch}
    {...restProps}
>
    <img
        src={imagePath}
        alt={item.title || item.name || item.original_name}
        class="absolute inset-0 h-full w-full select-none object-cover object-center transition-transform duration-300 ease-in-out focus:scale-105 group-hover:scale-105"
        loading="lazy"
    />

    {#if selectable}
        <div class="absolute left-2 top-2 z-10">
            <input type="radio" name={item.id} id={item.id} class="size-3" />
        </div>
    {/if}

    <div
        class="absolute right-0 top-2 z-10 flex items-center justify-center gap-1 rounded-l-md bg-neutral-950/50 px-2 py-1"
    >
        <Star class="size-3 text-yellow-400" />
        <span class="text-xs font-medium text-white">
            {roundOff(item.vote_average)}
        </span>
    </div>

    <div class="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent opacity-50"></div>

    <div
        class={cn(
            'absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-neutral-900/70 to-transparent p-2 text-white',
            'pointer-events-none translate-y-4 opacity-0',
            'transition-all duration-300 ease-in-out',
            'group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100',
            touched ? 'pointer-events-auto translate-y-0 opacity-100' : ''
        )}
    >
        <h3
            class="line-clamp-2 translate-y-2 transform text-lg transition-transform duration-300 ease-out group-hover:translate-y-0"
        >
            {item.title || item.name || item.original_name}
        </h3>
        <p
            class={cn(
                'mt-2 translate-y-2 transform text-sm transition-transform delay-75 duration-300 ease-out group-hover:translate-y-0',
                orientation === 'horizontal' ? 'line-clamp-2' : 'line-clamp-4'
            )}
        >
            {item.overview || item.description || item.summary}
        </p>
        <Button
            size="sm"
            class="mt-4 w-full translate-y-2 transform transition-transform delay-150 duration-300 ease-out group-hover:translate-y-0"
        >
            Request
        </Button>
    </div>
</AspectRatio>
