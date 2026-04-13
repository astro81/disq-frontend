<script lang="ts">
    import { leaveServer } from "$lib/remote/server/leave-server.remote";

    import Button from "$lib/components/ui/button/button.svelte";
    import Dialog from "$lib/components/ui/dialog/dialog.svelte";
    import DialogContent from "$lib/components/ui/dialog/dialog-content.svelte";
    import DialogHeader from "$lib/components/ui/dialog/dialog-header.svelte";
    import DialogTitle from "$lib/components/ui/dialog/dialog-title.svelte";
    import DialogDescription from "$lib/components/ui/dialog/dialog-description.svelte";
    import DialogFooter from "$lib/components/ui/dialog/dialog-footer.svelte";
    import type { ServerProps } from "$lib/types/server";

    let {
        isLeaveServerDialogOpen = $bindable(),
        currentServer,
    }: {
        isLeaveServerDialogOpen: boolean;
        currentServer: ServerProps;
    } = $props();
</script>

<Dialog bind:open={isLeaveServerDialogOpen}>
    <DialogContent class="sm:max-w-131.25">
        <DialogHeader>
            <DialogTitle>Leave Server</DialogTitle>
            <DialogDescription class="text-center text-zinc-500">
                Are you sure you want to leave
                <span class="font-semibold text-indigo-500/90">{currentServer?.serverName}</span>?
            </DialogDescription>
        </DialogHeader>

        <DialogFooter class="py-4">
            <form {...leaveServer} class="flex items-center justify-between w-full">
                <input {...leaveServer.fields.serverId.as('hidden', currentServer?.serverId ?? "")} />

                <Button
                        onclick={() => { isLeaveServerDialogOpen = false; }}
                        variant="ghost"
                        type="button"
                >Cancel</Button>

                <Button variant="destructive" type="submit" >
                    Confirm
                </Button>
            </form>
        </DialogFooter>
    </DialogContent>
</Dialog>