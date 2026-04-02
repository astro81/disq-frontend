<script lang="ts">
    import type { MemberProps, ServerMemberRole, ServerProps } from "$lib/types/server";
    import Button from "../ui/button/button.svelte";

    import {
        ChevronDown,
        ChevronRight,
        CirclePlus,
        LogOut,
        Settings,
        Trash,
        UserPlus,
        Users
    } from "@lucide/svelte";


    import DropdownMenu from "$lib/components/ui/dropdown-menu/dropdown-menu.svelte";
    import DropdownMenuTrigger from "$lib/components/ui/dropdown-menu/dropdown-menu-trigger.svelte";
    import DropdownMenuItem from "$lib/components/ui/dropdown-menu/dropdown-menu-item.svelte";
    import DropdownMenuContent from "$lib/components/ui/dropdown-menu/dropdown-menu-content.svelte";
    import DropdownMenuSeparator from "$lib/components/ui/dropdown-menu/dropdown-menu-separator.svelte";

    // import InviteMember from "../models/servers/InviteMember.svelte";
    // import ServerSettings from "../models/servers/ServerSettings.svelte";
    // import CreateChannel from "../models/channels/CreateChannel.svelte";
    // import LeaveServer from "../models/servers/LeaveServer.svelte";
    // import DeleteServer from "../models/servers/DeleteServer.svelte";
    // import ManageMember from "../models/servers/ManageMember.svelte";

    import { getCurrentServer } from "$lib/remote/server/current-server.remote";
    import { page } from "$app/state";

    import CreateChannel from "$lib/components/models/channel/CreateChannel.svelte";
    import InviteMember from "$lib/components/models/server/InviteMember.svelte";
    import LeaveServer from "$lib/components/models/server/LeaveServer.svelte";
    import DeleteServer from "$lib/components/models/server/DeleteServer.svelte";
    import ServerSettings from "$lib/components/models/server/ServerSettings.svelte";


    type ServerMemberAllProps = {
        memberId: string;
        role: "ADMIN" | "MODERATOR" | "GUEST";
        userId: string | null;
        username: string | null;
        userProfileImage: string | null;
        userDisplayName: string | null;
        userEmail: string | null;
        joinedAt: Date;
    };

    interface ServerHeaderProps {
        currentServer: ServerProps,
        role: ServerMemberRole,
        members: ServerMemberAllProps[],
        currentMember: MemberProps
    }

    let { currentServer, role, members, currentMember }: ServerHeaderProps = $props();

    let currServer = $derived(await getCurrentServer({ serverId: page.params.serverId ?? "" }));

    const isAdmin = $derived(role === 'ADMIN');
    const isModerator = $derived(isAdmin || role === 'MODERATOR');

    let serverName = $derived(currServer.serverName);
    let currentServerId = $derived(currServer.serverId);

    let isDropdownOpen = $state(false);

    let inviteDialogOpen = $state(false);
    let isServerEditDialogOpen = $state(false);
    let isManageMemberDialogOpen = $state(false);
    let isCreateChannelDialogOpen = $state(false);
    let isLeaveServerDialogOpen = $state(false);
    let isDeleteServerDialogOpen = $state(false);

</script>


<DropdownMenu bind:open={isDropdownOpen}>

    <div class="relative flex flex-col justify-center items-center">
        <div class="w-full flex justify-center items-center">
            <img
                    src={currServer.serverBannerImageUrl ?? currServer.serverImageUrl}
                    alt={currServer.serverName}
                    class="object-cover w-full h-full max-h-40 min-h-38 rounded-tl-3xl"
            >
        </div>

        <div class="absolute z-30 top-0 left-0 w-full">
            <DropdownMenuTrigger>
                {#snippet child({ props })}
                    <Button {...props}
                            class="rounded-tl-3xl min-w-full border-none active:border-none focus:border-none w-60
                            text-foreground-card bg-transparent hover:bg-transparent"
                    >
                        <span class="text-base font-medium overflow-hidden">{serverName}</span>
                        {#if !isDropdownOpen}
                            <ChevronDown class="size-5 ml-auto"/>
                        {:else}
                            <ChevronRight class="size-5 ml-auto"/>
                        {/if}
                    </Button>
                {/snippet}
            </DropdownMenuTrigger>
        </div>
    </div>

    <DropdownMenuContent align="end" class="w-56 text-xs font-medium text-black dark:text-neutral-400 space-y-0.5 absolute -translate-y-8 ml-2">
        {#if isModerator}
            <DropdownMenuItem
                    class="text-indigo-600 dark:text-indigo-400 px-3 py-2 cursor-pointer"
                    onclick={() => { inviteDialogOpen = true }}
            >Invite People
                <UserPlus class="size-4 ml-auto"/>
            </DropdownMenuItem>
        {/if}

        {#if isAdmin}
            <DropdownMenuItem
                    class="px-3 py-2 cursor-pointer"
                    onclick={() => { isServerEditDialogOpen = true }}
            >Server Settings
                <Settings class="size-4 ml-auto"/>
            </DropdownMenuItem>
        {/if}
        {#if isAdmin}
            <DropdownMenuItem
                    class="px-3 py-2 cursor-pointer"
                    onclick={() => { isManageMemberDialogOpen = true }}
            >Manage Members
                <Users class="size-4 ml-auto"/>
            </DropdownMenuItem>
        {/if}

        {#if isModerator}
            <DropdownMenuItem
                    class="px-3 py-2 cursor-pointer"
                    onclick={() => { isCreateChannelDialogOpen = true }}
            >Create Channels
                <CirclePlus class="size-4 ml-auto"/>
            </DropdownMenuItem>
        {/if}

        {#if isModerator}
            <DropdownMenuSeparator />
        {/if}

        {#if isAdmin}
            <DropdownMenuItem
                    class="text-rose-500 px-3 py-2 cursor-pointer"
                    onclick={() => { isDeleteServerDialogOpen = true }}
            >Delete Server
                <Trash class="text-rose-500 size-4 ml-auto"/>
            </DropdownMenuItem>
        {/if}

        {#if !isAdmin}
            <DropdownMenuItem
                    class="text-rose-500 px-3 py-2 cursor-pointer"
                    onclick={() => { isLeaveServerDialogOpen = true }}
            >Leave Server
                <LogOut class="text-rose-500 size-4 ml-auto"/>
            </DropdownMenuItem>
        {/if}

    </DropdownMenuContent>
</DropdownMenu>

<InviteMember bind:inviteDialogOpen currentServer={currServer}/>
<ServerSettings bind:isServerEditDialogOpen currentServer={currServer}/>

<CreateChannel bind:isCreateChannelDialogOpen currentServerId={currentServerId}/>

<LeaveServer bind:isLeaveServerDialogOpen currentServer={currServer}/>
<DeleteServer bind:isDeleteServerDialogOpen currentServer={currServer}/>

<!--<ManageMember bind:isManageMemberDialogOpen currentServer={currServer} {members} {currentMember}/>-->
