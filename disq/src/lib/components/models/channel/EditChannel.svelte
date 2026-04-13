<script lang="ts">
    import type { ChannelProps, MemberProps } from "$lib/types/server";
    import { invalidateAll } from "$app/navigation";
    import { CircleAlert, Lock, ChevronUp, ChevronDown, UserCheck, UserX, ShieldCheck } from "@lucide/svelte";

    import Button from "$lib/components/ui/button/button.svelte";
    import Input from "$lib/components/ui/input/input.svelte";
    import Dialog from "$lib/components/ui/dialog/dialog.svelte";
    import DialogTitle from "$lib/components/ui/dialog/dialog-title.svelte";
    import DialogContent from "$lib/components/ui/dialog/dialog-content.svelte";
    import DialogHeader from "$lib/components/ui/dialog/dialog-header.svelte";
    import DialogFooter from "$lib/components/ui/dialog/dialog-footer.svelte";
    import Field from "$lib/components/ui/field/field.svelte";
    import FieldSet from "$lib/components/ui/field/field-set.svelte";
    import FieldGroup from "$lib/components/ui/field/field-group.svelte";
    import FieldLabel from "$lib/components/ui/field/field-label.svelte";
    import FieldError from "$lib/components/ui/field/field-error.svelte";
    import Select from "$lib/components/ui/select/select.svelte";
    import SelectTrigger from "$lib/components/ui/select/select-trigger.svelte";
    import SelectContent from "$lib/components/ui/select/select-content.svelte";
    import SelectItem from "$lib/components/ui/select/select-item.svelte";
    import {
        editChannel,
        reorderChannel,
        getChannelAccessList,
        manageChannelAccess,
    } from "$lib/remote/channel/edit-channel.remote";


    interface EditChannelProps {
        isEditChannelDialogOpen: boolean;
        channel: ChannelProps;
        serverMembers: MemberProps[];
    }

    let { isEditChannelDialogOpen = $bindable(), channel, serverMembers = [] }: EditChannelProps = $props();

    // Tabs
    type Tab = 'general' | 'position' | 'access';
    let activeTab = $state<Tab>('general');

    // General tab
    let isLoading = $state(false);
    let channelName = $derived(channel.channelName);
    let channelNameError = $state('');
    let generalError = $state('');
    let isPrivate = $derived(channel.isPrivateChannel ?? false);

    const channelSelectTypes = [
        { value: "TEXT", label: "Text" },
        { value: "VOICE", label: "Voice" },
        { value: "VIDEO", label: "Video" },
    ];
    let selectValue = $derived(channel.channelType ?? "TEXT");
    const selectTriggerContent = $derived(
        channelSelectTypes.find(c => c.value === selectValue)?.label ?? "Text"
    );

    // Position tab
    let positionLoading = $state<'up' | 'down' | null>(null);
    let positionError = $state('');
    let positionSuccess = $state('');

    // Access tab
    let accessList = $state<string[]>([]);   // memberIds that have access
    let accessLoading = $state(false);
    let accessError = $state('');
    let pendingAccess = $state<Record<string, boolean>>({});

    const guestMembers = $derived(serverMembers.filter(m => m.role === 'GUEST'));

    // Reset on open
    $effect(() => {
        if (isEditChannelDialogOpen) {
            channelName = channel.channelName;
            selectValue = channel.channelType ?? "TEXT";
            isPrivate = channel.isPrivateChannel ?? false;
            channelNameError = '';
            generalError = '';
            positionError = '';
            positionSuccess = '';
            accessError = '';
            pendingAccess = {};
            activeTab = 'general';
            if (channel.isPrivateChannel) loadAccessList();
        }
    });

    async function loadAccessList() {
        accessLoading = true;
        accessError   = '';
        try {
            const data = await getChannelAccessList({ channelId: channel.channelId });
            accessList = (data as any[]).map(item =>
                typeof item === 'string' ? item : item.memberId
            );
        } catch {
            accessError = 'Failed to load access list';
        } finally {
            accessLoading = false;
        }
    }


    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        channelNameError = '';
        generalError = '';
        if (!channelName.trim()) { channelNameError = 'Channel name is required'; return; }
        isLoading = true;
        try {
            await editChannel({
                channelId: channel.channelId,
                channelName: channelName.trim(),
                channelType: selectValue,
                isPrivateChannel: isPrivate,
            });
            await invalidateAll();
            isEditChannelDialogOpen = false;
        } catch (err: any) {
            const msg = err?.message ?? 'Something went wrong';
            if (err?.field === 'channelName') channelNameError = msg;
            else generalError = msg;
        } finally {
            isLoading = false;
        }
    }

    // Position actions
    async function handleReorder(direction: 'up' | 'down') {
        positionError = '';
        positionSuccess = '';
        positionLoading = direction;
        try {
            await reorderChannel({ channelId: channel.channelId, direction });
            await invalidateAll();
            positionSuccess = `Channel moved ${direction}.`;
        } catch (err: any) {
            positionError = err?.message ?? 'Failed to reorder channel';
        } finally {
            positionLoading = null;
        }
    }

    // Access toggle
    async function toggleAccess(memberId: string, currentlyGranted: boolean) {
        pendingAccess = { ...pendingAccess, [memberId]: true };
        accessError = '';
        try {
            await manageChannelAccess({
                channelId: channel.channelId,
                memberId,
                grant: !currentlyGranted,
            });
            accessList = currentlyGranted
                ? accessList.filter(id => id !== memberId)
                : [...accessList, memberId];
        } catch (err: any) {
            accessError = err?.message ?? 'Failed to update access';
        } finally {
            const next = { ...pendingAccess };
            delete next[memberId];
            pendingAccess = next;
        }
    }
</script>

<Dialog bind:open={isEditChannelDialogOpen}>
    <DialogContent class="sm:max-w-lg">
        <DialogHeader>
            <DialogTitle>Edit Channel</DialogTitle>
        </DialogHeader>

        <!-- Tab bar -->
        <div class="flex gap-1 border-b border-zinc-200 dark:border-zinc-700 -mx-1 px-1 mt-2">
            {#each (
                [
                    { id: 'general', label: 'General', show: true },
                    { id: 'position', label: 'Position', show: true },
                    { id: 'access', label: 'Access', show: isPrivate },
                ] as const
            ) as tab (tab)}
                {#if tab.show}
                    <button
                            type="button"
                            onclick={() => activeTab = tab.id}
                            class="px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px
                               {activeTab === tab.id
                                 ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                 : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}"
                    >
                        {tab.label}
                    </button>
                {/if}
            {/each}
        </div>

        <!-- GENERAL -->
        {#if activeTab === 'general'}
            <form onsubmit={handleSubmit} class="flex flex-col gap-6 mt-4">

                {#if generalError}
                    <div class="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-3 flex items-start gap-2">
                        <CircleAlert class="w-5 h-5 mt-0.5 shrink-0" />
                        <p class="text-sm">{generalError}</p>
                    </div>
                {/if}

                <FieldSet>
                    <FieldGroup class="gap-2">

                        <Field data-invalid={!!channelNameError}>
                            <FieldLabel for="channelName">Channel Name</FieldLabel>
                            <Input
                                    id="channelName"
                                    type="text"
                                    bind:value={channelName}
                                    placeholder="Enter a unique channel name"
                                    disabled={isLoading}
                            />
                            {#if channelNameError}
                                <FieldError><p>{channelNameError}</p></FieldError>
                            {/if}
                        </Field>

                        <Field>
                            <FieldLabel>Channel Type</FieldLabel>
                            <Select type="single" bind:value={selectValue} disabled={isLoading}>
                                <SelectTrigger>{selectTriggerContent}</SelectTrigger>
                                <SelectContent>
                                    {#each channelSelectTypes as t (t.value)}
                                        <SelectItem value={t.value} label={t.label}>{t.label}</SelectItem>
                                    {/each}
                                </SelectContent>
                            </Select>
                        </Field>

                        <Field>
                            <button
                                    type="button"
                                    onclick={() => {
                                    isPrivate = !isPrivate;
                                    if (isPrivate) loadAccessList();
                                }}
                                    disabled={isLoading}
                                    class="flex items-center justify-between w-full rounded-md px-3 py-3
                                       bg-zinc-100 dark:bg-zinc-800
                                       hover:bg-zinc-200 dark:hover:bg-zinc-700
                                       transition-colors text-left"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="p-1.5 rounded-md bg-zinc-200 dark:bg-zinc-700">
                                        <Lock class="size-4 text-zinc-600 dark:text-zinc-300" />
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-sm font-medium text-zinc-800 dark:text-zinc-200">Private Channel</span>
                                        <span class="text-xs text-zinc-500 dark:text-zinc-400">Only admins, moderators, and allowed members can view</span>
                                    </div>
                                </div>
                                <div class="relative shrink-0 ml-4 w-10 h-6 rounded-full transition-colors duration-200
                                            {isPrivate ? 'bg-indigo-500' : 'bg-zinc-300 dark:bg-zinc-600'}">
                                    <span class="absolute top-1 left-1 size-4 rounded-full bg-white shadow transition-transform duration-200
                                                 {isPrivate ? 'translate-x-4' : 'translate-x-0'}"></span>
                                </div>
                            </button>
                        </Field>

                    </FieldGroup>
                </FieldSet>

                <DialogFooter>
                    <Button type="button" variant="ghost" onclick={() => isEditChannelDialogOpen = false} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} class="bg-indigo-500 text-foreground hover:bg-indigo-500/90">
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>

            </form>
        {/if}

        <!--  POSITION -->
        {#if activeTab === 'position'}
            <div class="flex flex-col gap-5 mt-4">

                {#if positionError}
                    <div class="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-3 flex items-start gap-2">
                        <CircleAlert class="w-5 h-5 mt-0.5 shrink-0" />
                        <p class="text-sm">{positionError}</p>
                    </div>
                {/if}

                {#if positionSuccess}
                    <div class="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 p-3">
                        <p class="text-sm">{positionSuccess}</p>
                    </div>
                {/if}

                <p class="text-sm text-zinc-500 dark:text-zinc-400">
                    Move <span class="font-semibold text-zinc-700 dark:text-zinc-300">#{channel.channelName}</span> up or down in the channel list.
                </p>

                <div class="flex gap-3">
                    <button
                            type="button"
                            onclick={() => handleReorder('up')}
                            disabled={!!positionLoading}
                            class="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-3
                               bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700
                               text-sm font-medium text-zinc-700 dark:text-zinc-300
                               disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-zinc-200 dark:border-zinc-700"
                    >
                        <ChevronUp class="size-4" />
                        {positionLoading === 'up' ? 'Moving...' : 'Move Up'}
                    </button>

                    <button
                            type="button"
                            onclick={() => handleReorder('down')}
                            disabled={!!positionLoading}
                            class="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-3
                               bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700
                               text-sm font-medium text-zinc-700 dark:text-zinc-300
                               disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-zinc-200 dark:border-zinc-700"
                    >
                        <ChevronDown class="size-4" />
                        {positionLoading === 'down' ? 'Moving...' : 'Move Down'}
                    </button>
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onclick={() => isEditChannelDialogOpen = false}>
                        Close
                    </Button>
                </DialogFooter>
            </div>
        {/if}

        <!-- ACCESS -->
        {#if activeTab === 'access'}
            <div class="flex flex-col gap-4 mt-4">

                {#if accessError}
                    <div class="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-3 flex items-start gap-2">
                        <CircleAlert class="w-5 h-5 mt-0.5 shrink-0" />
                        <p class="text-sm">{accessError}</p>
                    </div>
                {/if}

                <p class="text-sm text-zinc-500 dark:text-zinc-400">
                    Grant or revoke access for <span class="font-medium text-zinc-700 dark:text-zinc-300">Guest</span> members.
                    Admins and moderators always have access to private channels.
                </p>

                {#if accessLoading}
                    <div class="flex items-center justify-center py-10 text-zinc-400">
                        <span class="text-sm">Loading members...</span>
                    </div>
                {:else if guestMembers.length === 0}
                    <div class="flex flex-col items-center justify-center py-10 gap-3 text-zinc-400 dark:text-zinc-500">
                        <ShieldCheck class="size-9" />
                        <p class="text-sm">No guest members in this server.</p>
                    </div>
                {:else}
                    <div class="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-0.5">
                        {#each guestMembers as member (member.memberId)}
                            {@const granted = accessList.includes(member.memberId)}
                            {@const loading = !!pendingAccess[member.memberId]}
                            <div class="flex items-center justify-between rounded-md px-3 py-2.5
                                        bg-zinc-50 dark:bg-zinc-800/60
                                        border border-zinc-100 dark:border-zinc-700/50">

                                <!-- Avatar + name -->
                                <div class="flex items-center gap-3 min-w-0">
                                    {#if member.userProfileImage}
                                        <img
                                                src={member.userProfileImage}
                                                alt={member.username ?? 'Member'}
                                                class="size-8 rounded-full object-cover shrink-0"
                                        />
                                    {:else}
                                        <div class="size-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                                            <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                                {(member.username ?? member.userId ?? '?')[0].toUpperCase()}
                                            </span>
                                        </div>
                                    {/if}
                                    <div class="min-w-0">
                                        <p class="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                                            {member.username ?? member.userId}
                                        </p>
                                        <p class="text-xs text-zinc-400 dark:text-zinc-500">Guest</p>
                                    </div>
                                </div>

                                <!-- Grant / Revoke pill -->
                                <button
                                        type="button"
                                        onclick={() => toggleAccess(member.memberId, granted)}
                                        disabled={loading}
                                        class="shrink-0 ml-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium
                                           transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                                           {granted
                                             ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400'
                                             : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400'}"
                                >
                                    {#if loading}
                                        <span class="w-8 text-center">...</span>
                                    {:else if granted}
                                        <UserCheck class="size-3.5" />
                                        <span>Access</span>
                                    {:else}
                                        <UserX class="size-3.5" />
                                        <span>No Access</span>
                                    {/if}
                                </button>
                            </div>
                        {/each}
                    </div>
                {/if}

                <DialogFooter>
                    <Button type="button" variant="ghost" onclick={() => isEditChannelDialogOpen = false}>
                        Close
                    </Button>
                </DialogFooter>
            </div>
        {/if}

    </DialogContent>
</Dialog>