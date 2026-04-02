<!-- lib/components/navigation/NaviagtionSidebar -->
<script lang="ts">
    import { page } from "$app/state";

    import {getJoinedServers} from "$lib/remote/server/joined-server.remote";

    import ModeToggleButton from "$lib/components/ModeToggleButton.svelte";

    import Separator from "$lib/components/ui/separator/separator.svelte";
    import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";

    import { Compass, UserRound } from "@lucide/svelte";

    import NavigationLink from "$lib/components/navigation/NavigationLink.svelte";

    import CreateServer from "$lib/components/models/server/CreateServer.svelte";
    import NavigationItem from "./NavigationItem.svelte";

    // joinedServers comes from remote function
    let joinedServers = $derived(await getJoinedServers());
</script>
<div class="space-y-4 flex flex-col items-center h-full text-primary w-full dark:bg-[#1e1f22] bg-sidebar-border py-3">

    <NavigationLink href="/servers/@me" label="Me">
        {#snippet icon()}
            <UserRound size="25" />
        {/snippet}
    </NavigationLink>

    <CreateServer />

    <NavigationLink href="/servers/discovery" label="Explore">
        {#snippet icon()}
            <Compass size="25" />
        {/snippet}
    </NavigationLink>

    <Separator class="h-0.5 bg-zinc-300 dark:bg-zinc-700 rounded-md w-10! mx-auto"/>

    <ScrollArea class="w-full h-[60dvh]">
        {#each joinedServers as server (server.serverId)}
            <div class="mb-4">
                <NavigationItem
                        serverId={server.serverId}
                        serverName={server.serverName}
                        serverImageUrl={server.serverImageUrl}/>
            </div>
        {/each}
    </ScrollArea>

    <div class="pb-3 mt-auto flex items-center flex-col gap-y-4">
        <ModeToggleButton />

        <!-- <UserButton /> -->
    </div>
</div>