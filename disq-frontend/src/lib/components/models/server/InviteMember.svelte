<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";

    import { Check, Copy, RefreshCw } from "@lucide/svelte";

    import Button from "$lib/components/ui/button/button.svelte";

    import Input from "$lib/components/ui/input/input.svelte";
    import Label from "$lib/components/ui/label/label.svelte";

    import Dialog from "$lib/components/ui/dialog/dialog.svelte";
    import DialogContent from "$lib/components/ui/dialog/dialog-content.svelte";
    import DialogHeader from "$lib/components/ui/dialog/dialog-header.svelte";
    import DialogTitle from "$lib/components/ui/dialog/dialog-title.svelte";

    import { regenerateInviteCode } from '$lib/remote/server/invite.remote'

    let {
        inviteDialogOpen = $bindable(),
        currentServer
    } = $props();

    let origin = $state("");

    onMount(() => {
        origin = browser ? window.location.origin : "";
    });

    let inviteCode = $derived(currentServer.serverInviteCode);
    let inviteUrl = $derived(origin + `/invite/${inviteCode}`);

    let copied = $state(false);
    let isLoading = $state(false);
    let regenerateError = $state<string | null>(null);

    const onCopy = () => {
        navigator.clipboard.writeText(inviteUrl);
        copied = true;
        setTimeout(() => { copied = false; }, 1000);
    }

    const handleRegenerate = async () => {
        isLoading = true;
        regenerateError = null;
        try {
            const data = await regenerateInviteCode({ serverId: currentServer.serverId });
            inviteCode = data.serverInviteCode;
        } catch (e: any) {
            regenerateError = e?.message ?? 'Something went wrong.';
        } finally {
            isLoading = false;
        }
    }
</script>

<Dialog bind:open={inviteDialogOpen}>
    <DialogContent class="sm:max-w-131.25">
        <DialogHeader>
            <DialogTitle>Invite People</DialogTitle>
        </DialogHeader>

        <div class="mt-2">
            <Label class="uppercase text-xs font-bold text-zinc-500">Server Invite Link</Label>
            <div class="flex items-center mt-2 gap-x-2">
                <Input
                        class="bg-zinc-300/50 border-0 focus-visible:right-0 focus-visible:ring-offset-0"
                        value={inviteUrl}
                        disabled={isLoading}
                />
                <Button size="icon" disabled={isLoading} onclick={onCopy}>
                    {#if copied}
                        <Check class="size-4"/>
                    {:else}
                        <Copy class="size-4"/>
                    {/if}
                </Button>
            </div>

            {#if regenerateError}
                <p class="text-xs text-destructive mt-2">{regenerateError}</p>
            {/if}

            <Button
                    disabled={isLoading}
                    variant="link"
                    size="sm"
                    class="text-xs text-zinc-500 mt-4 px-0!"
                    onclick={handleRegenerate}
            >
                Generate a new link
                <RefreshCw class="size-4 ml-2"/>
            </Button>
        </div>
    </DialogContent>
</Dialog>