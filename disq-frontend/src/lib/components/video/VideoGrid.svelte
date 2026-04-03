<script lang="ts">
    import { videoState } from '$lib/stores/video.svelte'
    import VideoTile from "$lib/components/video/VideoTile.svelte";

    let count = $derived(videoState.participants.length)

    let gridClass = $derived(
        count <= 1 ? 'grid-cols-1' :
            count <= 2 ? 'grid-cols-2' :
                count <= 4 ? 'grid-cols-2' :
                    'grid-cols-3'
    )
</script>

<div class="flex-1 overflow-auto bg-zinc-950 p-4">
    <div class="grid h-full gap-3 {gridClass}">
        {#each videoState.participants as participant (participant.memberId)}
            <VideoTile {participant} />
        {/each}
    </div>
</div>