<script lang="ts">
    import type { PageProps } from './$types'

    import {joinVideoChannel, leaveVideoChannel} from "$lib/stores/video.svelte";
    import VideoGrid from "$lib/components/video/VideoGrid.svelte";
    import VideoControls from "$lib/components/video/VideoControls.svelte";

    import {joinVoiceChannel, leaveVoiceChannel} from "$lib/stores/voice.svelte";
    import VoiceGrid from "$lib/components/voice/VoiceGrid.svelte";
    import VoiceControls from "$lib/components/voice/VoiceControls.svelte";

    let { data }: PageProps = $props()

    let currentChannel = $derived(data.currentChannel)
    let currentMember = $derived(data.currentChannelMember)
    let channelType = $derived(currentChannel.channelType.toLowerCase())

    // Handle voice store mounting
    $effect(() => {
        if (channelType === 'voice') {
            joinVoiceChannel(currentChannel.channelId, currentMember)
            return () => leaveVoiceChannel()
        }
    })

    // Handle video store mounting
    $effect(() => {
        if (channelType === 'video') {
            joinVideoChannel(currentChannel.channelId, currentMember)
            return () => leaveVideoChannel()
        }
    })

</script>

{#if channelType === 'voice'}
    <div class="flex h-screen flex-col bg-zinc-950">
        <div class="flex h-12 items-center justify-between border-b border-zinc-800 px-4">
            <span class="text-sm font-semibold text-zinc-200">{currentChannel.channelName}</span>
<!--            <button-->
<!--                    onclick={() => showChat = !showChat}-->
<!--                    class="rounded-lg px-3 py-1 text-xs transition-->
<!--               {showChat ? 'bg-indigo-600 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}"-->
<!--            >-->
<!--                {showChat ? 'Hide Chat' : 'Show Chat'}-->
<!--            </button>-->
        </div>
        <div class="flex flex-1 overflow-hidden">
            <div class="flex flex-1 flex-col">
                <VoiceGrid/>
                <VoiceControls onLeave={() => history.back()}/>
            </div>
            <!--{#if showChat}-->
            <!--    <div class="flex w-72 flex-col border-l border-zinc-800">-->
            <!--        <ChatMessages currentMemberId={currentMember.memberId}/>-->
            <!--        <ChatInput channelName={currentChannel.channelName}/>-->
            <!--    </div>-->
            <!--{/if}-->
        </div>
    </div>
{/if}

{#if channelType === 'video'}
    <div class="flex h-screen flex-col bg-zinc-950">

        <div class="flex h-12 items-center justify-between border-b border-zinc-800 px-4">
            <span class="text-sm font-semibold text-zinc-200">{currentChannel.channelName}</span>
<!--            <button-->
<!--                    onclick={() => showChat = !showChat}-->
<!--                    class="rounded-lg px-3 py-1 text-xs transition-->
<!--               {showChat ? 'bg-indigo-600 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}"-->
<!--            >-->
<!--                {showChat ? 'Hide Chat' : 'Show Chat'}-->
<!--            </button>-->
        </div>

        <div class="flex flex-1 overflow-hidden">
            <div class="flex flex-1 flex-col">
                <VideoGrid/>
                <VideoControls onLeave={() => history.back()}/>
            </div>

            <!--{#if showChat}-->
            <!--    <div class="flex w-72 flex-col border-l border-zinc-800">-->
            <!--        <ChatMessages currentMemberId={currentMember.memberId}/>-->
            <!--        <ChatInput channelName={currentChannel.channelName}/>-->
            <!--    </div>-->
            <!--{/if}-->
        </div>
    </div>
{/if}