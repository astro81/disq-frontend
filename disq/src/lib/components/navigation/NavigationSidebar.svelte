<!-- lib/components/navigation/NaviagtionSidebar -->
<script lang="ts">
	import { page } from '$app/state';

	import { getJoinedServers } from '$lib/remote/server/joined-server.remote';

	import ModeToggleButton from '$lib/components/ModeToggleButton.svelte';

	import Separator from '$lib/components/ui/separator/separator.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';

	import { Compass, UserRound, Users } from '@lucide/svelte';
	import { pendingFriendRequests } from '$lib/stores/notification.svelte';

	import NavigationLink from '$lib/components/navigation/NavigationLink.svelte';

	import CreateServer from '$lib/components/models/server/CreateServer.svelte';
	import NavigationItem from './NavigationItem.svelte';

	// joinedServers comes from remote function
	let joinedServers = $derived(await getJoinedServers());
</script>

<div
	class="flex h-full w-full flex-col items-center space-y-4 bg-sidebar-border py-3 text-primary dark:bg-[#1e1f22]"
>
	<NavigationLink href="/servers/@me" label="Me">
		{#snippet icon()}
			<UserRound size="25" />
		{/snippet}
	</NavigationLink>

	<NavigationLink href="/servers/friends" label="Friends">
		{#snippet icon()}
			<div class="relative">
				<Users size="25" />
				{#if pendingFriendRequests.count > 0}
					<div
						class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-zinc-900"
					>
						{pendingFriendRequests.count > 9 ? '9+' : pendingFriendRequests.count}
					</div>
				{/if}
			</div>
		{/snippet}
	</NavigationLink>

	<CreateServer />

	<NavigationLink href="/servers/discovery" label="Explore">
		{#snippet icon()}
			<Compass size="25" />
		{/snippet}
	</NavigationLink>

	<Separator class="mx-auto h-0.5 w-10! rounded-md bg-zinc-300 dark:bg-zinc-700" />

	<ScrollArea class="h-[60dvh] w-full">
		{#each joinedServers as server (server.serverId)}
			<div class="mb-4">
				<NavigationItem
					serverId={server.serverId}
					serverName={server.serverName}
					serverImageUrl={server.serverImageUrl}
				/>
			</div>
		{/each}
	</ScrollArea>

	<div class="mt-auto flex flex-col items-center gap-y-4 pb-3">
		<ModeToggleButton />

		<!-- <UserButton /> -->
	</div>
</div>
