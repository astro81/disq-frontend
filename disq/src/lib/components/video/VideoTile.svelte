<script lang="ts">
    import { Mic, MicOff, VideoOff, Monitor } from '@lucide/svelte'
    import type { VideoParticipant } from '$lib/stores/video.svelte'

    interface Props {
        participant: VideoParticipant
    }

    let { participant }: Props = $props()

    let videoEl: HTMLVideoElement | undefined = $state()

    $effect(() => {
        if (videoEl && participant.stream) {
            videoEl.srcObject = participant.stream
        }
    })
</script>

<div class="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-zinc-900">
    {#if participant.stream && participant.videoEnabled}
        <video
                bind:this={videoEl}
                autoplay
                playsinline
                muted={participant.isLocal}
                class="h-full w-full object-cover {participant.isLocal && !participant.isScreenSharing ? 'scale-x-[-1]' : ''}"
        ></video>
    {:else}
        <div class="flex flex-col items-center gap-2">
            <div class="flex size-16 items-center justify-center rounded-full bg-zinc-700 text-2xl font-bold text-white">
                {participant.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span class="text-sm text-zinc-400">{participant.displayName}</span>
        </div>
    {/if}

    <!-- Name + status tag -->
    <div class="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
        {#if !participant.audioEnabled}
            <MicOff class="size-3 text-red-400" />
        {:else}
            <Mic class="size-3 text-emerald-400" />
        {/if}
        {#if participant.isScreenSharing}
            <Monitor class="size-3 text-indigo-400" />
        {/if}
        {participant.displayName}{participant.isLocal ? ' (You)' : ''}
    </div>

    {#if !participant.videoEnabled}
        <div class="absolute right-2 top-2 rounded-lg bg-black/60 p-1 backdrop-blur-sm">
            <VideoOff class="size-3 text-red-400" />
        </div>
    {/if}

    {#if participant.isScreenSharing}
        <div class="absolute left-2 top-2 rounded-lg bg-indigo-600/80 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
            Sharing screen
        </div>
    {/if}
</div>