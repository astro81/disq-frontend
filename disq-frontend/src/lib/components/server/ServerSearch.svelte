<script lang="ts">
    import { goto } from "$app/navigation";
    import { page } from "$app/state";

    import { Hash, Mic, Search, ShieldAlert, ShieldCheck, Video } from "@lucide/svelte";

    import CommandDialog from "$lib/components/ui/command/command-dialog.svelte";
    import CommandInput from "$lib/components/ui/command/command-input.svelte";
    import CommandList from "$lib/components/ui/command/command-list.svelte";
    import CommandEmpty from "$lib/components/ui/command/command-empty.svelte";
    import CommandGroup from "$lib/components/ui/command/command-group.svelte";
    import CommandItem from "$lib/components/ui/command/command-item.svelte";


    interface ServerSearchProps {
        data: {
            label: string;
            type: "channel" | "member";
            data: {
                id: string;
                name: string;
                type: string;
            }[] | undefined
        }[]
    }

    let { data }: ServerSearchProps = $props();

    let open = $state(false);

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            open = !open;
        }
    }

    const onClick = ({ id, type }: { id: string, type: "channel" | "member" }) => {
        open = false;

        if (type === "member") goto(`/servers/${page.params.serverId}/conversations/${id}`);

        if (type === "channel") goto(`/servers/${page.params.serverId}/channels/${id}`);
    }
</script>

<svelte:document onkeydown={handleKeydown} />

<div>
    <button
            class="group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition"
            onclick={() => open = true }
    >
        <Search class="size-4 text-zinc-500 dark:text-zinc-400"/>

        <p class="font-semibold text-sm text-zinc-500 dark:text-zinc-400
            group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition">Search</p>

        <kbd class="pointer-events-none inline-flex h-5 select-none gap-1 items-center rounded border not-last:bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto">
            <span class="text-xs">Ctrl</span>+ K
        </kbd>
    </button>

    <CommandDialog bind:open>
        <CommandInput placeholder="Search all channels and members"/>

        <CommandList>
            <CommandEmpty>
                No Results found
            </CommandEmpty>

            {#each data as { label, type, data: items } (label)}

                <CommandGroup heading={label}>
                    {#if items}
                        {#each items as item (item)}
                            <CommandItem onSelect={() => onClick({ id: item.id, type })}>
                                {#if item.type === "TEXT"}
                                    <Hash class="size-4 mr-2"/>
                                {:else if item.type === "VOICE"}
                                    <Mic class="size-4 mr-2"/>
                                {:else if item.type === "VIDEO"}
                                    <Video class="size-4 mr-2"/>
                                {:else if item.type === "MODERATOR"}
                                    <ShieldCheck class="size-4 mr-2 text-indigo-500"/>
                                {:else if item.type === "ADMIN"}
                                    <ShieldAlert class="size-4 mr-2 text-rose-500"/>
                                {/if}

                                <span>{item.name}</span>
                            </CommandItem>
                        {/each}
                    {/if}
                </CommandGroup>
            {/each}



        </CommandList>
    </CommandDialog>
</div>
