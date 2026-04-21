<script lang="ts">
	import { Search, UserPlus, Check, Loader2 } from '@lucide/svelte';
	import { searchUsers } from '$lib/remote/friend/friend.remote';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';

	let open = $state(false);
	let query = $state('');
	let results = $state<any[]>([]);
	let loading = $state(false);
	let requestStates = $state<Record<string, 'idle' | 'loading' | 'sent'>>({});

	// Handle search with basic debouncing/effect
	$effect(() => {
		const q = query.trim();
		if (q.length < 2) {
			results = [];
			return;
		}

		const timeout = setTimeout(async () => {
			loading = true;
			try {
				results = await searchUsers({ query: q });
			} catch (e) {
				console.error('Search failed:', e);
			} finally {
				loading = false;
			}
		}, 300);

		return () => clearTimeout(timeout);
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			open = !open;
		}
	}

	async function handleSendRequest(userId: string) {
		if (requestStates[userId] === 'loading' || requestStates[userId] === 'sent') return;
		requestStates[userId] = 'loading';

		try {
			const res = await fetch('/api/friends?action=request', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ addresseeId: userId })
			});
			if (res.ok) {
				requestStates[userId] = 'sent';
			} else {
				requestStates[userId] = 'idle';
			}
		} catch {
			requestStates[userId] = 'idle';
		}
	}
</script>

<svelte:document onkeydown={handleKeydown} />

<div class="px-3 py-2">
	<button
		class="group flex w-full items-center gap-x-2 rounded-md px-2 py-2 transition hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50"
		onclick={() => (open = true)}
	>
		<Search class="size-4 text-zinc-500 dark:text-zinc-400" />
		<p
			class="text-sm font-semibold text-zinc-500 transition group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300"
		>
			Find Friends
		</p>
		<kbd
			class="pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 select-none"
		>
			<span class="text-xs">Ctrl</span>K
		</kbd>
	</button>

	<Command.Dialog bind:open shouldFilter={false}>
		<div class="flex items-center border-b px-3">
			<Command.Input
				bind:value={query}
				placeholder="Search by username..."
				class="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
			/>
			{#if loading}
				<Loader2 class="size-4 animate-spin opacity-50" />
			{/if}
		</div>
		<Command.List>
			{#if query.length > 0 && results.length === 0 && !loading}
				<Command.Empty>No users found.</Command.Empty>
			{/if}

			{#if results.length > 0}
				<Command.Group heading="Global Search">
					{#each results as user (user.id)}
						<Command.Item
							value={user.name}
							class="flex items-center justify-between px-2 py-1.5 text-sm outline-none"
						>
							<div class="flex items-center gap-2">
								<Avatar.Root class="size-8">
									<Avatar.Image src={user.image} alt={user.displayName} />
									<Avatar.Fallback>{user.displayName?.[0]}</Avatar.Fallback>
								</Avatar.Root>
								<div class="flex flex-col">
									<span class="font-medium">{user.displayName}</span>
									<span class="text-xs text-muted-foreground">@{user.name}</span>
								</div>
							</div>

							<button
								onclick={() => handleSendRequest(user.id)}
								disabled={requestStates[user.id] === 'loading' || requestStates[user.id] === 'sent'}
								class="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5
									text-xs font-medium text-white transition-colors hover:bg-indigo-700
									disabled:opacity-50"
							>
								{#if requestStates[user.id] === 'sent'}
									<Check class="size-3.5" />
									Sent
								{:else}
									<UserPlus class="size-3.5" />
									Add
								{/if}
							</button>
						</Command.Item>
					{/each}
				</Command.Group>
			{/if}
		</Command.List>
	</Command.Dialog>
</div>
