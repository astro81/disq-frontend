<script lang="ts">

    import {kickServerMember} from "$lib/remote/member/kick-member.remote";
    import {changeMemberRole} from "$lib/remote/member/change-role.remote";

    import type { ServerMemberRole } from "$lib/types/server";

    import {
        Check,
        EllipsisVertical,
        Gavel,
        LoaderCircle,
        Shield,
        ShieldAlert,
        ShieldCheck,
    } from "@lucide/svelte";

    import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";

    import Dialog from "$lib/components/ui/dialog/dialog.svelte";
    import DialogContent from "$lib/components/ui/dialog/dialog-content.svelte";
    import DialogHeader from "$lib/components/ui/dialog/dialog-header.svelte";
    import DialogTitle from "$lib/components/ui/dialog/dialog-title.svelte";
    import DialogDescription from "$lib/components/ui/dialog/dialog-description.svelte";

    import DropdownMenu from "$lib/components/ui/dropdown-menu/dropdown-menu.svelte";
    import DropdownMenuTrigger from "$lib/components/ui/dropdown-menu/dropdown-menu-trigger.svelte";
    import DropdownMenuContent from "$lib/components/ui/dropdown-menu/dropdown-menu-content.svelte";
    import DropdownMenuItem from "$lib/components/ui/dropdown-menu/dropdown-menu-item.svelte";
    import DropdownMenuSeparator from "$lib/components/ui/dropdown-menu/dropdown-menu-separator.svelte";


    import type { MemberProps, ServerProps } from "$lib/types/server";
    import Avatar from "$lib/components/ui/avatar/avatar.svelte";
    import AvatarImage from "$lib/components/ui/avatar/avatar-image.svelte";

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

    let {
        isManageMemberDialogOpen = $bindable(),
        currentServer,
        currentMember,
        members
    }: {
        isManageMemberDialogOpen: boolean;
        currentServer: ServerProps;
        currentMember: MemberProps;
        members: ServerMemberAllProps[]
    } = $props();


    let memberCount = $derived<number>(members.length);
    let currentServerId = $derived<string>(currentServer.serverId);

    let loadingId = $state("");

    const onRoleChange = async (memberId: string, role: ServerMemberRole, serverId: string) => {
        if (!serverId) return alert("Server ID is missing");
        try {
            loadingId = memberId;

            await changeMemberRole({ memberId, role, serverId });
        } catch (error) {
            alert(error);
        } finally {
            loadingId = "";
        }
    }

    const onKick = async (memberId: string, serverId: string) => {
        if (!serverId) return alert("Server ID is missing");
        try {
            loadingId = memberId;
            await kickServerMember({ memberId, serverId });
        } catch (error) {
            alert(error);
        } finally {
            loadingId = "";
        }
    }


</script>

<Dialog bind:open={isManageMemberDialogOpen}>
    <DialogContent class="sm:max-w-131.25">
        <DialogHeader>
            <DialogTitle>Manage Members</DialogTitle>
            <DialogDescription class="text-zinc-500">
                {memberCount} Members
            </DialogDescription>
        </DialogHeader>

        <ScrollArea class="mt-8 max-h-105 pr-6">
            {#each members as member (member)}
                <div class="flex items-center gap-x-2 mb-6">
                    <Avatar class="size-7 md:size-10">
                        <AvatarImage src={member.userProfileImage} />
                    </Avatar>

                    <div class="flex flex-col gap-y-1">
                        <div class="text-xs font-semibold flex items-center">
                            {member.username}
                            {#if member.role === "MODERATOR"}
                                <ShieldCheck class="size-4 ml-2 text-indigo-500" />
                            {:else if member.role === "ADMIN"}
                                <ShieldAlert class="size-4 text-rose-500" />
                            {/if}
                        </div>
                        <p class="text-xs text-zinc-500 ">{member.userEmail}</p>
                    </div>

                    <!--! Only admin is allowed and no actions can be performed on admin, do not show options for admin -->
                    {#if currentMember.userId !== member.userId && loadingId !== member.memberId}
                        <div class="ml-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger>
                                    <EllipsisVertical class="size-4 text-zinc-500"/>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent side="right">
                                    <!-- Role change -->
                                    <DropdownMenuItem onclick={() => onRoleChange(member.memberId, "GUEST", currentServerId)}>
                                        <Shield class="size-4"/>
                                        Guest
                                        {#if member.role === "GUEST"}
                                            <Check class="size-4 ml-auto"/>
                                        {/if}
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onclick={() => onRoleChange(member.memberId, "MODERATOR", currentServerId)}>
                                        <ShieldCheck class="size-4"/>
                                        Moderator
                                        {#if member.role === "MODERATOR"}
                                            <Check class="size-4 ml-auto"/>
                                        {/if}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <!-- Kick member -->
                                    <DropdownMenuItem onclick={() => onKick(member.memberId, currentServer?.serverId ?? "")}>
                                        <Gavel class="size-4"/>
                                        Kick
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    {/if}

                    {#if loadingId === member.memberId}
                        <LoaderCircle class="animate-spin text-zinc-500 ml-auto size-4"/>
                    {/if}

                </div>
            {/each}
        </ScrollArea>

    </DialogContent>
</Dialog>
