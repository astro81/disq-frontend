<script lang="ts">
	import type { PageProps } from './$types';
	import {
		connectToDm,
		disconnectDm,
		sendDmMessage,
		dmMessages,
		dmSocketState,
		dmHistoryState,
		loadMoreDmHistory
	} from '$lib/stores/dm-socket.svelte';
	import type { DmWSMessage } from '$lib/stores/dm-socket.svelte';
	import { UserRound } from '@lucide/svelte';

	let { data }: PageProps = $props();

	let friendUser = $derived(data.friendUser);
	let conversation = $derived(data.conversation);
	let currentUser = $derived(data.currentUser);

	// Connect to DM WebSocket when conversation changes
	$effect(() => {
		if (conversation?.dmConversationId && currentUser) {
			connectToDm(conversation.dmConversationId, {
				userId: currentUser.id,
				displayName: currentUser.displayName ?? currentUser.name,
				username: currentUser.name,
				userProfileImage: currentUser.image ?? null,
				userBannerImage: currentUser.profileBannerImage ?? null
			});
			return () => disconnectDm();
		}
	});

	let messageInput = $state('');
	let messagesEndRef: HTMLDivElement | undefined = $state();
	let scrollContainer: HTMLDivElement | undefined = $state();

	function handleSend() {
		const text = messageInput.trim();
		if (!text) return;
		sendDmMessage(text);
		messageInput = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	// Auto-scroll to bottom on new messages
	$effect(() => {
		if (dmMessages.current.length) {
			messagesEndRef?.scrollIntoView({ behavior: 'smooth' });
		}
	});

	// Load more history on scroll to top
	function handleScroll() {
		if (!scrollContainer) return;
		if (scrollContainer.scrollTop === 0 && dmHistoryState.hasMore && !dmHistoryState.isLoading) {
			loadMoreDmHistory();
		}
	}

	function formatTime(ts: number | string) {
		const date = typeof ts === 'string' ? new Date(ts) : new Date(ts);
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	function formatDate(ts: number | string) {
		const date = typeof ts === 'string' ? new Date(ts) : new Date(ts);
		return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<div class="flex h-screen flex-col">
	<!-- DM Header -->
	<div class="flex h-12 items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
		{#if friendUser?.image}
			<img
				src={friendUser.image}
				alt={friendUser.displayName}
				class="mr-3 size-7 rounded-full object-cover"
			/>
		{:else}
			<div
				class="mr-3 flex size-7 items-center justify-center rounded-full bg-zinc-300 text-xs font-bold dark:bg-zinc-600"
			>
				{friendUser?.displayName?.[0]?.toUpperCase() ?? '?'}
			</div>
		{/if}
		<div>
			<p class="text-sm font-semibold">{friendUser?.displayName}</p>
		</div>
		{#if dmSocketState.current === 'connecting'}
			<span class="ml-auto text-xs text-yellow-500">Connecting...</span>
		{:else if dmSocketState.current === 'error'}
			<span class="ml-auto text-xs text-red-500">Connection error</span>
		{/if}
	</div>

	<!-- Messages area -->
	<div class="flex-1 overflow-y-auto px-4 py-3" bind:this={scrollContainer} onscroll={handleScroll}>
		{#if dmHistoryState.isLoading}
			<div class="flex justify-center py-2">
				<span class="text-xs text-muted-foreground">Loading older messages...</span>
			</div>
		{/if}

		{#each dmMessages.current as msg, i (msg.dmMessageId ?? i)}
			{@const isLocal = msg.userId === currentUser?.id}
			<div class="mb-3 flex {isLocal ? 'justify-end' : 'justify-start'}">
				<div class="flex max-w-[70%] gap-2 {isLocal ? 'flex-row-reverse' : ''}">
					<!-- Avatar -->
					{#if msg.userProfileImage}
						<img
							src={msg.userProfileImage}
							alt={msg.displayName}
							class="mt-1 size-8 shrink-0 rounded-full object-cover"
						/>
					{:else}
						<div
							class="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-300 text-xs font-bold dark:bg-zinc-600"
						>
							{msg.displayName?.[0]?.toUpperCase() ?? '?'}
						</div>
					{/if}

					<!-- Message bubble -->
					<div>
						<div class="flex items-baseline gap-2 {isLocal ? 'flex-row-reverse' : ''}">
							<span class="text-xs font-semibold">{msg.displayName}</span>
							<span class="text-[10px] text-muted-foreground">
								{formatTime(msg.createdAt ?? msg.timestamp)}
							</span>
						</div>
						<div
							class="mt-0.5 rounded-lg px-3 py-1.5 text-sm
							{isLocal
								? 'bg-indigo-600 text-white'
								: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'}"
						>
							{msg.message}
						</div>
					</div>
				</div>
			</div>
		{/each}

		<div bind:this={messagesEndRef}></div>
	</div>

	<!-- Chat input -->
	<div class="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
		<div class="flex items-center gap-2">
			<input
				type="text"
				bind:value={messageInput}
				onkeydown={handleKeydown}
				placeholder="Message @{friendUser?.displayName ?? 'friend'}"
				class="flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700"
				disabled={dmSocketState.current !== 'open'}
			/>
			<button
				onclick={handleSend}
				disabled={dmSocketState.current !== 'open' || !messageInput.trim()}
				class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
			>
				Send
			</button>
		</div>
	</div>
</div>
