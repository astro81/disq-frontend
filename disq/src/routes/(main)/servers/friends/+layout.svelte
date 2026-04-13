<script lang="ts">
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { Users, Check, X, Bell } from '@lucide/svelte';
	import { invalidateAll } from '$app/navigation';
	import UserSearch from '$lib/components/friend/UserSearch.svelte';

	let { data, children }: LayoutProps = $props();

	let friends = $derived(data.friends);
	let pendingRequests = $derived(data.pendingRequests);
	let currentFriendId = $derived(page.params.friendId);

	async function handleAction(friendshipId: string, action: 'accept' | 'reject') {
		try {
			const res = await fetch(`/api/friends?action=${action}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ friendshipId })
			});
			if (res.ok) {
				await invalidateAll();
			}
		} catch (e) {
			console.error(`Failed to ${action} friend request:`, e);
		}
	}
</script>

<div class="flex h-full">
	<!-- Friends sidebar -->
	<aside
		class="flex h-screen w-64 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
	>
		<div class="flex h-12 items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
			<Users class="mr-2 size-4 text-zinc-500" />
			<h2 class="text-sm font-semibold">Friends</h2>
		</div>

		<UserSearch />

		<div class="flex-1 overflow-y-auto p-2">
			<!-- Pending Requests Section -->
			{#if pendingRequests && pendingRequests.length > 0}
				<div class="mb-4">
					<div
						class="flex items-center gap-2 px-2 py-1 text-[10px] font-bold tracking-wider text-zinc-500 uppercase"
					>
						<Bell class="size-3" />
						Pending Requests ({pendingRequests.length})
					</div>
					{#each pendingRequests as req (req.friendshipId)}
						<div
							class="group flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
						>
							{#if req.requesterImage}
								<img
									src={req.requesterImage}
									alt={req.requesterDisplayName}
									class="size-8 rounded-full object-cover"
								/>
							{:else}
								<div
									class="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400"
								>
									{req.requesterDisplayName?.[0]?.toUpperCase() ?? '?'}
								</div>
							{/if}
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium">{req.requesterDisplayName}</p>
								<p class="truncate text-[10px] text-muted-foreground">Incoming request</p>
							</div>
							<div class="flex gap-1">
								<button
									onclick={() => handleAction(req.friendshipId, 'accept')}
									class="rounded-full bg-zinc-200 p-1.5 transition-colors hover:bg-emerald-500 hover:text-white dark:bg-zinc-700 dark:hover:bg-emerald-600"
									title="Accept"
								>
									<Check class="size-3" />
								</button>
								<button
									onclick={() => handleAction(req.friendshipId, 'reject')}
									class="rounded-full bg-zinc-200 p-1.5 transition-colors hover:bg-red-500 hover:text-white dark:bg-zinc-700 dark:hover:bg-red-600"
									title="Reject"
								>
									<X class="size-3" />
								</button>
							</div>
						</div>
					{/each}
					<div class="mt-2 h-px bg-zinc-200 dark:bg-zinc-800"></div>
				</div>
			{/if}

			<!-- Friends Section -->
			<div
				class="flex items-center px-2 py-1 text-[10px] font-bold tracking-wider text-zinc-500 uppercase"
			>
				Direct Messages
			</div>

			{#if friends.length === 0}
				<p class="px-2 py-4 text-center text-xs text-muted-foreground italic">
					No friends yet. Add friends from user profiles!
				</p>
			{:else}
				{#each friends as friend (friend.friendUserId)}
					<a
						href="/servers/friends/{friend.friendUserId}"
						class="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
							{currentFriendId === friend.friendUserId
							? 'bg-zinc-200 dark:bg-zinc-700'
							: 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
					>
						{#if friend.friendImage}
							<img
								src={friend.friendImage}
								alt={friend.friendDisplayName}
								class="size-8 rounded-full object-cover"
							/>
						{:else}
							<div
								class="flex size-8 items-center justify-center rounded-full bg-zinc-300 text-xs font-bold text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200"
							>
								{friend.friendDisplayName?.[0]?.toUpperCase() ?? '?'}
							</div>
						{/if}

						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{friend.friendDisplayName}</p>
							<p class="truncate text-xs text-muted-foreground">@{friend.friendUsername}</p>
						</div>
					</a>
				{/each}
			{/if}
		</div>
	</aside>

	<!-- Main content area -->
	<div class="flex-1">
		{@render children()}
	</div>
</div>
