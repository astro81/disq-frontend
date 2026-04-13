<script lang="ts">
    import { Mic, MicOff } from '@lucide/svelte'
    import type { VoiceParticipant } from '$lib/stores/voice.svelte'

    interface Props {
        participant: VoiceParticipant
    }

    let { participant }: Props = $props()
</script>

<div class="flex flex-col items-center gap-2">
    <div
            class="relative flex size-16 items-center justify-center rounded-full transition-all duration-150
           {participant.isSpeaking
             ? 'ring-4 ring-emerald-500 ring-offset-2 ring-offset-zinc-900'
             : 'ring-2 ring-zinc-700 ring-offset-2 ring-offset-zinc-900'}"
    >
        {#if participant.userProfileImage}
            <img
                    src={participant.userProfileImage}
                    alt={participant.displayName}
                    class="size-full rounded-full object-cover"
            />
        {:else}
            <div class="flex size-full items-center justify-center rounded-full bg-zinc-700 text-xl font-bold text-white">
                {participant.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
        {/if}

        <!-- Muted badge -->
        {#if !participant.audioEnabled}
            <div class="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-red-600 ring-2 ring-zinc-900">
                <MicOff class="size-3 text-white" />
            </div>
        {:else if participant.isSpeaking}
            <div class="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-600 ring-2 ring-zinc-900">
                <Mic class="size-3 text-white" />
            </div>
        {/if}
    </div>

    <span class="max-w-20 truncate text-center text-xs text-zinc-300">
    {participant.displayName}{participant.isLocal ? ' (You)' : ''}
  </span>
</div>