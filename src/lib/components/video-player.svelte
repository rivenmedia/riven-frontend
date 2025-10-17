<script lang="ts">
import Hls from "hls.js";
import { onMount, onDestroy } from "svelte";

// Props
let { src }: { src: string | null } = $props();

// State
let videoEl: HTMLVideoElement = $state()!;
let hls: Hls | null = null; // Not reactive
let levels: any[] = $state([]);
let selectedIndex = $state(-1); // -1 = auto

// Watch for src changes
$effect(() => {
  if (src) {
    initializePlayer(src);
  } else {
    cleanup();
  }
});

function initializePlayer(source: string) {
  // Clean up existing instance
  cleanup();
  
  // Reset state
  levels = [];
  selectedIndex = -1;

  if (!videoEl) return;

  if (Hls.isSupported()) {
    hls = new Hls({ maxBufferLength: 30, lowLatencyMode: true });
    
    hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        console.log(data)
      levels = data.levels;
      videoEl.play().catch(() => {});
    });
    
    hls.on(Hls.Events.ERROR, (_, data) => {
      console.error("HLS error", data);
    });

    hls.loadSource(source);
    hls.attachMedia(videoEl);
  } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
    videoEl.src = source;
    videoEl.play().catch(() => {});
  }
}

function cleanup() {
  if (hls) {
    hls.destroy();
    hls = null;
  }
}

function changeQuality(index: number) {
  if (!hls) return;
  selectedIndex = index;
  hls.currentLevel = index; // -1 = auto
}

onDestroy(() => {
  cleanup();
});
</script>

<div class="relative h-full w-full">
  <video
    bind:this={videoEl}
    controls
    class="w-full h-full object-contain bg-black">
    <track kind="captions" />
  </video>

  {#if levels.length > 0}
    <div class="flex gap-2 items-center">
      <label for="quality-select">Quality:</label>
      <select 
        id="quality-select" 
        bind:value={selectedIndex} 
        onchange={(e) => changeQuality(+(e.target as HTMLSelectElement)?.value)}
      >
        <option value="-1">Auto</option>
        {#each levels as level, i}
          <option value={i}>
            {level.height}p ({Math.round(level.bitrate / 1000)} kbps)
          </option>
        {/each}
      </select>
    </div>
  {/if}
</div>