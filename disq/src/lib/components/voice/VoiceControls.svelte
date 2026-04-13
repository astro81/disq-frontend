<script lang="ts">
    import { Mic, MicOff, PhoneOff } from '@lucide/svelte'
    import { voiceState, toggleAudio, leaveVoiceChannel } from '$lib/stores/voice.svelte'

    interface Props {
        onLeave: () => void
    }

    let { onLeave }: Props = $props()

    async function handleLeave() {
        await leaveVoiceChannel()
        onLeave()
    }
</script>

<div class="flex items-center justify-center gap-3 border-t border-zinc-800 bg-zinc-950 px-6 py-4">
    <button
            onclick={toggleAudio}
            title={voiceState.audioEnabled ? 'Mute' : 'Unmute'}
            class="flex size-11 items-center justify-center rounded-full transition
           {voiceState.audioEnabled ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-red-600 hover:bg-red-500'}"
    >
        {#if voiceState.audioEnabled}
            <Mic class="size-5 text-white" />
        {:else}
            <MicOff class="size-5 text-white" />
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