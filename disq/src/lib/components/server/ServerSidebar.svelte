<script lang="ts">
    import {getUserState} from "$lib/stores/user-state.svelte";

    import ScrollArea from "../ui/scroll-area/scroll-area.svelte";
    import Separator from "../ui/separator/separator.svelte";

    import ServerSearch from "./ServerSearch.svelte";
    import ServerChannel from "$lib/components/server/ServerChannel.svelte";
    import ServerSection from "$lib/components/server/ServerSection.svelte";

    import {getCurrentServerChannelsList} from "$lib/remote/channel/current-channel.remote";

    import {page} from "$app/state";

    import {getCurrentServer} from "$lib/remote/server/current-server.remote";
    import {getCurrentMember, getCurrentMemberList} from "$lib/remote/member/current-member.remote";
    import ServerHeader from "$lib/components/server/ServerHeader.svelte";

    let serverId = $derived(page.params.serverId ?? "");

    const userState = getUserState();
    let user = $derived(userState.user);


    const fetchCurrentServer = async (serverId: string) => {
        return getCurrentServer({ serverId });
    };

    const fetchCurrentMember = async (serverId: string) => {
        return getCurrentMember({ serverId });
    };

    const fetchCurrentServerMembers = async (serverId: string) => {
        return getCurrentMemberList({ serverId });
    };

    const fetchCurrentServerChannels = async (serverId: string) => {
        return getCurrentServerChannelsList({ serverId });
    };

    let currentServer = $derived(await fetchCurrentServer(serverId));
    let channelsList = $derived(await fetchCurrentServerChannels(serverId));

    let currentMember = $derived(await fetchCurrentMember(serverId));
    let membersList = $derived( await fetchCurrentServerMembers(serverId))

    let textChannelsList = $derived(channelsList.filter(channel => channel.channelType === 'TEXT'));
    let voiceChannelsList = $derived(channelsList.filter(channel => channel.channelType === 'VOICE'));
    let videoChannelsList = $derived(channelsList.filter(channel => channel.channelType === 'VIDEO'));

    const currentServerMembersList = $derived(membersList.filter(member => member.userId !== user?.id));

    const role = $derived(currentMember.role);
</script>

<div class="max-w-60 flex flex-col size-full text-primary dark:bg-[#2b2d31] bg-[#f2f3f5] rounded-tl-3xl">

    <ServerHeader {currentServer} {role} members={currentServerMembersList} {currentMember}/>


    <ScrollArea class="flex-1 px-3">
        <div class="mt-2">
            <ServerSearch data={[
                {
                    label: "Text Channels",
                    type: "channel",
                    data: textChannelsList?.map((channel) => ({
                        id: channel.channelId,
                        name: channel.channelName,
                        type: channel.channelType
                    }))
                },
                {
                    label: "Voice Channels",
                    type: "channel",
                    data: voiceChannelsList?.map((channel) => ({
                        id: channel.channelId,
                        name: channel.channelName,
                        type: channel.channelType
                    }))
                },
                {
                    label: "Video Channels",
                    type: "channel",
                    data: videoChannelsList?.map((channel) => ({
                        id: channel.channelId,
                        name: channel.channelName,
                        type: channel.channelType
                    }))
                },
                {
                    label: "Members",
                    type: "member",
                    data: currentServerMembersList?.map((member) => ({
                        id: member.memberId,
                        name: member.username ?? "User",
                        type: member.role
                    }))
                }
            ]}/>
        </div>

        <Separator class="bg-zinc-200 dark:bg-zinc-700 rounded-md my-2"/>

        {#if textChannelsList.length > 0}
            <div class="mb-2">
                <ServerSection
                        sectionType="channels"
                        label="Text Channels"
                        channelType="TEXT"
                        {role}
                        currentServerId={currentServer.serverId}
                />
                {#each textChannelsList as channel (channel)}
                    <ServerChannel
                            {channel}
                            {role}
                            members={currentServerMembersList}
                    />
                {/each}
            </div>
        {/if}

        {#if voiceChannelsList.length > 0}
            <div class="mb-2">
                <ServerSection
                        sectionType="channels"
                        label="Voice Channels"
                        channelType="VOICE"
                        {role}
                        currentServerId={currentServer.serverId}
                />
                {#each voiceChannelsList as channel (channel)}
                    <ServerChannel
                            {channel}
                            {role}
                            members={currentServerMembersList}
                    />
                {/each}
            </div>
        {/if}

        {#if videoChannelsList.length > 0}
            <div class="mb-2">
                <ServerSection
                        sectionType="channels"
                        label="Video Channels"
                        channelType="VIDEO"
                        {role}
                        currentServerId={currentServer.serverId}
                />
                {#each videoChannelsList as channel (channel)}
                    <ServerChannel
                            {channel}
                            {role}
                            members={currentServerMembersList}
                    />
                {/each}
            </div>
        {/if}

    </ScrollArea>
</div>