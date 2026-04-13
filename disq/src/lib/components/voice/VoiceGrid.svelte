<script lang="ts">
    import { voiceState } from '$lib/stores/voice.svelte'
    import VoiceParticipantTile from "$lib/components/voice/VoiceParticipantTile.svelte";
</script>

<div class="flex flex-1 flex-wrap items-center justify-center gap-6 overflow-auto bg-zinc-950 p-8">
    {#each voiceState.participants as participant (participant.memberId)}
        <VoiceParticipantTile {participant} />
    {/each}

    {#if voiceState.participants.length === 0}
        <p class="text-sm text-zinc-500">Waiting for others to join…</p>
    {/if}
</div>