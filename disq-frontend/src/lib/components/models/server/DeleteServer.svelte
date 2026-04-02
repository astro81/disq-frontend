<script lang="ts">
    import { deleteServer } from "$lib/remote/server/delete-server.remote";

    import Button from "$lib/components/ui/button/button.svelte";
    import Dialog from "$lib/components/ui/dialog/dialog.svelte";
    import DialogContent from "$lib/components/ui/dialog/dialog-content.svelte";
    import DialogHeader from "$lib/components/ui/dialog/dialog-header.svelte";
    import DialogTitle from "$lib/components/ui/dialog/dialog-title.svelte";
    import DialogDescription from "$lib/components/ui/dialog/dialog-description.svelte";
    import DialogFooter from "$lib/components/ui/dialog/dialog-footer.svelte";

    let { currentServer, isDeleteServerDialogOpen = $bindable() } = $props();
</script>

<Dialog bind:open={isDeleteServerDialogOpen}>
    <DialogContent class="sm:max-w-131.25">
        <DialogHeader>
            <DialogTitle class="text-center">Delete Server</DialogTitle>
            <DialogDescription class="text-center text-zinc-500">
                Are you sure you want to delete
                <span class="font-semibold text-indigo-500/90">{currentServer?.serverName}</span>?
            </DialogDescription>
        </DialogHeader>

        <DialogFooter class="py-4">
            <form {...deleteServer} class="flex items-center justify-between w-full">
                <input {...deleteServer.fields.serverId.as('hidden', currentServer?.serverId ?? "")} />

                <Button
                        onclick={() => { isDeleteServerDialogOpen = false; }}
                        variant="ghost"
                        type="submit"
                >Cancel</Button>

                <Button variant="destructive" type="submit">
                    Confirm
                </Button>
            </form>
        </DialogFooter>
    </DialogContent>
</Dialog>