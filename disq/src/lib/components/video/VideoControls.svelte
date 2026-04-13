<script lang="ts">
    import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff } from '@lucide/svelte'
    import {
        videoState,
        toggleAudio,
        toggleVideo,
        toggleScreenShare,
        leaveVideoChannel,
    } from '$lib/stores/video.svelte'

    interface Props {
        onLeave: () => void
    }

    let { onLeave }: Props = $props()

    async function handleScreenShare() {
        await toggleScreenShare()
    }

    async function handleLeave() {
        await leaveVideoChannel()
        onLeave()
    }
</script>

<div class="flex items-center justify-center gap-3 border-t border-zinc-800 bg-zinc-950 px-6 py-4">

    <button
            onclick={toggleAudio}
            title={videoState.audioEnabled ? 'Mute' : 'Unmute'}
            class="flex size-11 items-center justify-center rounded-full transition
           {videoState.audioEnabled ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-red-600 hover:bg-red-500'}"
    >
        {#if videoState.audioEnabled}
            <Mic class="size-5 text-white" />
        {:else}
            <MicOff class="size-5 text-white" />
        {/if}
    </button>

    <button
            onclick={toggleVideo}
            title={videoState.videoEnabled ? 'Turn off camera' : 'Turn on camera'}
            class="flex size-11 items-center justify-center rounded-full transition
           {videoState.videoEnabled ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-red-600 hover:bg-red-500'}"
    >
        {#if videoState.videoEnabled}
            <Video class="size-5 text-white" />
        {:else}
            <VideoOff class="size-5 text-white" />
        {/if}
    </button>

    <button
            onclick={handleScreenShare}
            title={videoState.isScreenSharing ? 'Stop sharing' : 'Share screen'}
            class="flex size-11 items-center justify-center rounded-full transition
           {videoState.isScreenSharing ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-zinc-700 hover:bg-zinc-600'}"
    >
        {#if videoState.isScreenSharing}
            <MonitorOff class="size-5 text-white" />
        {:else}
            <Monitor class="size-5 text-white" />
        {/if}
    </button>

    <button
            onclick={handleLeave}
            title="Leave call"
            class="flex size-11 items-center justify-center rounded-full bg-red-600 transition hover:bg-red-500"
    >
        <PhoneOff class="size-5 text-white" />
    </button>
</div>