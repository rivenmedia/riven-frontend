<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import Hls from 'hls.js';

    interface VideoPlayerProps {
        itemId: number;
        class?: string;
    }

    let { itemId, class: className = "" }: VideoPlayerProps = $props();

    let videoElement: HTMLVideoElement;
    let hls: Hls;
    let error = $state<string | null>(null);

    // Direct stream URL (Original method)
    const directUrl = `/api/stream/${itemId}`;
    // HLS Proxy URL
    const hlsParams = new URLSearchParams({
        pix_fmt: 'yuv420p',
        profile: 'high',
        level: '4.1',
        // resolution: '1920x1080' // Optional: Uncomment to force 1080p
    });
    const hlsUrl = `/api/stream/${itemId}/hls/index.m3u8?${hlsParams.toString()}`;

    function needsHls(): boolean {
        // Simple check: Create a dummy video and ask if it plays HEVC
        if (typeof document === 'undefined') return false;
        const v = document.createElement('video');
        // Check for HEVC support (hvc1/hev1)
        const canPlay = v.canPlayType('video/mp4; codecs="hvc1"') || 
                        v.canPlayType('video/mp4; codecs="hev1"');
        
        // If browser says "probably" or "maybe", we try direct play. 
        // If "", we assume it can't play it and switch to HLS.
        return canPlay === "";
    }

    onMount(() => {
        if (needsHls()) {
            console.log("HEVC not supported. Switching to HLS transcoding.");
            if (Hls.isSupported()) {
                hls = new Hls({
                    // Download up to 60 seconds ahead (default is 30)
                    maxBufferLength: 60,
                    // Keep up to 2 minutes in memory
                    maxMaxBufferLength: 120,
                    // Start prefetching the next segment even if the current one is still processing
                    maxLoadingDelay: 4,
                });
                hls.loadSource(hlsUrl);
                hls.attachMedia(videoElement);
                
                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                         console.error("HLS Fatal Error:", data);
                         error = "Transcoding failed";
                    }
                });
            }
        } else {
            console.log("HEVC supported. Using Direct Play.");
            videoElement.src = directUrl;
        }
    });

    onDestroy(() => {
        if (hls) hls.destroy();
    });
</script>

{#if error}
    <div class="flex h-full w-full items-center justify-center rounded-lg bg-red-500/20 p-8">
        <p class="text-red-500">{error}</p>
    </div>
{:else}
    <div class="relative {className}">
        <video
            bind:this={videoElement}
            controls
            class="h-full w-full rounded-lg bg-black"
            playsinline>
        </video>
    </div>
{/if}