<script lang="ts">
    import type { PageProps } from './$types'
    import { Maximize2, Users, Search } from '@lucide/svelte'
    import { Button } from '$lib/components/ui/button/index.js'
    import { joinServer } from '$lib/remote/server/discover.remote';

    let { data }: PageProps = $props()

    let servers = $derived(data.servers)
    let joinedServerIds = $derived(data.joinedServerIds)

    let searchQuery = $state('')

    let filteredServers = $derived(
        searchQuery.trim() === ''
            ? servers
            : servers.filter(s =>
                s.serverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (s.serverDescription ?? '').toLowerCase().includes(searchQuery.toLowerCase())
            )
    )

    let isPopupOpen = $state(false)
    let popupPosition = $state({ x: 0, y: 0 })
    let selectedServer = $state<typeof servers[number] | null>(null)

    function openPopup(e: MouseEvent, server: typeof servers[number]) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const popupWidth = 340
        const margin = 8

        const x = rect.left - popupWidth - margin > 0
            ? rect.left - popupWidth - margin
            : rect.right + margin

        popupPosition = { x, y: rect.top }
        selectedServer = server
        isPopupOpen = true
    }

    function closePopup() {
        isPopupOpen = false
        selectedServer = null
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }

    function formatMembers(count: number) {
        if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
        return String(count)
    }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && closePopup()} />

<div class="h-full flex flex-col overflow-hidden">
    <section class="flex-1 overflow-y-auto px-20 py-8">

        <h1 class="text-5xl font-extrabold uppercase mb-10">Find your community</h1>

        <!-- Search bar -->
        <div class="relative mb-8 max-w-md min-w-full">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
                    type="text"
                    placeholder="Search servers..."
                    bind:value={searchQuery}
                    class="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm
                       placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
        </div>

        {#if servers.length === 0}
            <p class="text-muted-foreground">No public servers yet. Be the first to create one!</p>
        {:else if filteredServers.length === 0}
            <p class="text-muted-foreground">No servers match "<span class="text-foreground">{searchQuery}</span>".</p>
        {:else}
            <h2 class="text-xl font-medium mb-6">
                {searchQuery.trim() ? `Results for "${searchQuery}"` : 'Featured Servers'}
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {#each filteredServers as server (server.serverId)}
                    <div class="relative h-80 outline outline-border rounded-lg group overflow-hidden flex flex-col">

                        <button
                                type="button"
                                onclick={(e) => openPopup(e, server)}
                                class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition
                                   bg-background/80 backdrop-blur p-2 rounded-md z-20"
                                aria-label="Expand {server.serverName}"
                        >
                            <Maximize2 class="size-4 text-muted-foreground" />
                        </button>

                        {@render CardImage(server)}

                        <div class="flex flex-col flex-1 px-4 pt-10 pb-4">
                            <div class="flex-1">
                                <h3 class="font-semibold truncate">{server.serverName}</h3>
                                <p class="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {server.serverDescription ?? 'No description available.'}
                                </p>
                            </div>

                            <div class="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                                <Users class="size-3" />
                                <span>{formatMembers(server.totalMembers)} members</span>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </section>
</div>

{#if isPopupOpen && selectedServer}
    {@const alreadyJoined = joinedServerIds.includes(selectedServer.serverId)}

    <div
            class="fixed inset-0 z-40"
            role="button"
            tabindex="0"
            aria-label="Close popup"
            onclick={closePopup}
            onkeydown={(e) => e.key === 'Escape' && closePopup()}
    ></div>

    <div
            class="fixed z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-popup"
            style="top: {popupPosition.y}px; left: {popupPosition.x}px; width: 340px"
            role="dialog"
            aria-label="{selectedServer.serverName} details"
            aria-modal="true"
    >
        {@render CardImage(selectedServer)}

        <div class="px-4 pt-10 pb-6">
            <h3 class="text-lg font-semibold">{selectedServer.serverName}</h3>

            <div class="flex items-center gap-4 mt-1 mb-3">
                <div class="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users class="size-3.5" />
                    <span>{formatMembers(selectedServer.totalMembers)} members</span>
                </div>
                <span class="text-sm text-muted-foreground">
                    Est. {formatDate(selectedServer.createdAt)}
                </span>
            </div>

            <p class="text-sm text-muted-foreground mb-5">
                {selectedServer.serverDescription ?? 'No description available.'}
            </p>

            {#if alreadyJoined}
                <Button
                        href="/servers/{selectedServer.serverId}"
                        class="w-full bg-chart-2 hover:bg-chart-2/90 font-semibold"
                >
                    Visit Server
                </Button>
            {:else}
                {#each joinServer.fields.serverId.issues() as issue (issue)}
                    <p class="text-sm text-destructive mb-3">{issue.message}</p>
                {/each}

                <form {...joinServer}>
                    <input {...joinServer.fields.serverId.as('hidden', selectedServer.serverId)} />
                    <Button
                            type="submit"
                            class="w-full bg-chart-2 hover:bg-chart-2/90 font-semibold"
                    >
                        Join Server
                    </Button>
                </form>
            {/if}
        </div>
    </div>
{/if}

{#snippet CardImage(server: typeof servers[number])}
    <div class="relative h-32 w-full shrink-0">
        {#if server.serverBannerImageUrl}
            <img src={server.serverBannerImageUrl} alt="" class="size-full object-cover" />
        {:else}
            <img src="https://github.com/shadcn.png" alt={server.serverName} class="size-full object-cover" />
        {/if}

        <div class="absolute -bottom-6 left-4 size-14 rounded-xl overflow-hidden border-4 border-card shadow-sm">
            <img src={server.serverImageUrl} alt={server.serverName} class="w-full h-full object-cover" />
        </div>
    </div>
{/snippet}

<style>
    .animate-popup {
        animation: popup 0.15s ease-out forwards;
        transform-origin: top left;
        transform: scale(0.95);
        opacity: 0;
    }

    @keyframes popup {
        to { transform: scale(1); opacity: 1; }
    }
</style>