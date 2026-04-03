<script lang="ts">
    import type { ChannelProps } from "$lib/types/server";
    import { invalidateAll, goto } from "$app/navigation";
    import { page } from "$app/state";
    import { CircleAlert, Trash2 } from "@lucide/svelte";

    import Button from "$lib/components/ui/button/button.svelte";
    import Dialog from "$lib/components/ui/dialog/dialog.svelte";
    import DialogTitle from "$lib/components/ui/dialog/dialog-title.svelte";
    import DialogContent from "$lib/components/ui/dialog/dialog-content.svelte";
    import DialogHeader from "$lib/components/ui/dialog/dialog-header.svelte";
    import DialogFooter from "$lib/components/ui/dialog/dialog-footer.svelte";
    import { resolve } from "$app/paths";
    import {deleteChannelRemote} from "$lib/remote/channel/delete-channel.remote";

    interface DeleteChannelProps {
        isDeleteChannelDialogOpen: boolean;
        channel: ChannelProps;
    }

    let { isDeleteChannelDialogOpen = $bindable(), channel }: DeleteChannelProps = $props();

    let isLoading = $state(false);
    let globalError = $state('');

    $effect(() => {
        if (isDeleteChannelDialogOpen) {
            globalError = '';
        }
    });

    async function handleDelete() {
        globalError = '';
        isLoading = true;

        try {
            await deleteChannelRemote({ channelId: channel.channelId });

            await invalidateAll();
            isDeleteChannelDialogOpen = false;

            // If we're currently viewing the deleted channel, redirect to the server root
            if (page.params?.channelId === channel.channelId) {
                await goto(resolve(`/servers/${page.params.serverId}`));
            }
        } catch (e: any) {
            globalError = e?.message ?? 'Something went wrong';
        } finally {
            isLoading = false;
        }
    }
</script>

<Dialog bind:open={isDeleteChannelDialogOpen}>
    <DialogContent class="sm:max-w-md">
        <DialogHeader>
            <DialogTitle>Delete Channel</DialogTitle>
        </DialogHeader>

        <div class="flex flex-col gap-4 mt-2">

            {#if globalError}
                <div class="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-3 flex items-start gap-2">
                    <CircleAlert class="w-5 h-5 mt-0.5 shrink-0" />
                    <p class="text-sm">{globalError}</p>
                </div>
            {/if}

            <!-- Warning icon + message -->
            <div class="flex flex-col items-center gap-3 py-2 text-center">
                <div class="p-3 rounded-full bg-red-100 dark:bg-red-950/40">
                    <Trash2 class="size-6 text-red-600 dark:text-red-400" />
                </div>
                <div class="flex flex-col gap-1">
                    <p class="text-sm text-zinc-700 dark:text-zinc-300">
                        Are you sure you want to delete
                        <span class="font-semibold text-zinc-900 dark:text-zinc-100">#{channel.channelName}</span>?
                    </p>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400">
                        This action cannot be undone. All messages in this channel will be permanently lost.
                    </p>
                </div>
            </div>

        </div>

        <DialogFooter class="mt-2">
            <Button
                    type="button"
                    variant="ghost"
                    onclick={() => isDeleteChannelDialogOpen = false}
                    disabled={isLoading}
            >
                Cancel
            </Button>
            <Button
                    type="button"
                    onclick={handleDelete}
                    disabled={isLoading}
                    class="bg-red-500 text-white hover:bg-red-600"
            >
                {isLoading ? 'Deleting...' : 'Delete Channel'}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>