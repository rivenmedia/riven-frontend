<script lang="ts">
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    $inspect(data);
</script>

<pre class="bg-neutral-800 p-4 rounded-lg">
    <code class="text-sm">
        {JSON.stringify(data, null, 2)}
    </code>
</pre>