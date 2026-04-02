<script lang="ts">
    import type { MemberProps, ServerChannelType, ServerMemberRole } from "$lib/types/server";

    import { Plus, Settings } from "@lucide/svelte";
    import CreateChannel from "$lib/components/models/channel/CreateChannel.svelte";

    // import ManageMember from "$lib/componen/ts/modals/server/ManageMember.svelte";

    interface ServerSectionProps {
        sectionType: "channels" | "members";
        label: string;
        role?: ServerMemberRole;
        channelType: ServerChannelType;
        currentServerId: string;
        currentServerMembersList?: MemberProps[];
    }


    let {
        sectionType,
        label,
        role,
        channelType,
        currentServerId,
        currentServerMembersList
    }: ServerSectionProps = $props();

    let isCreateChannelDialogOpen = $state(false);
    let isManageMemberDialogOpen = $state(false);

</script>

<div class="flex items-center justify-between py-2">
    <p class="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">{label}</p>

    {#if role !== "GUEST" && sectionType === "channels"}
        <button
                class="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
                onclick={() => { isCreateChannelDialogOpen = true }}
        >
            <Plus class="size-4"/>
        </button>
    {/if}

    {#if role === "ADMIN" && sectionType === "members"}
        <button
                class="text-zinc-500 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300 transition"
                onclick={() => { isManageMemberDialogOpen = true }}
        >
            <Settings class="size-4"/>
        </button>
    {/if}
</div>

<CreateChannel bind:isCreateChannelDialogOpen predefinedChannelType={channelType} {currentServerId}/>
<!-- <ManageMember bind:isManageMemberDialogOpen members={currentServerMembersList}/> -->
