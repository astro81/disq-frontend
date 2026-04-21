<!-- DmChatMessages.svelte -->
<script lang="ts">
	import {
		dmMessages,
		dmHistoryState,
		loadMoreDmHistory,
		deleteDmMessage
	} from '$lib/stores/dm-socket.svelte';
	import { Loader, FileIcon, Download } from '@lucide/svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import CodeBlock from '../snippet/CodeBlock.svelte';
	import MessageContextMenu from './MessageContextMenu.svelte';

	interface Props {
		currentUserId: string;
	}

	let { currentUserId }: Props = $props();

	let bottomEl: HTMLDivElement | undefined = $state();
	let topSentinel: HTMLDivElement | undefined = $state();
	let scrollContainer: HTMLDivElement | undefined = $state();
	let prevMessageCount = $state(0);
	let initialScrollDone = $state(false);

	// Context menu state
	let contextMenu = $state<{
		show: boolean;
		x: number;
		y: number;
		messageText: string;
		messageId: string | null;
		isMine: boolean;
	}>({ show: false, x: 0, y: 0, messageText: '', messageId: null, isMine: false });

	function showContextMenu(e: MouseEvent, msg: (typeof dmMessages.current)[0], isMine: boolean) {
		e.preventDefault();
		contextMenu = {
			show: true,
			x: e.clientX,
			y: e.clientY,
			messageText: msg.message,
			messageId: msg.dmMessageId,
			isMine
		};
	}

	function handleDeleteMessage() {
		if (contextMenu.messageId) {
			deleteDmMessage(contextMenu.messageId);
		}
	}

	$effect(() => {
		const count = dmMessages.current.length;
		if (count === 0) return;
		if (!initialScrollDone) {
			requestAnimationFrame(() => {
				bottomEl?.scrollIntoView({ behavior: 'instant' });
				initialScrollDone = true;
			});
		} else if (count > prevMessageCount && !dmHistoryState.isLoading) {
			bottomEl?.scrollIntoView({ behavior: 'smooth' });
		}
		prevMessageCount = count;
	});

	$effect(() => {
		if (!topSentinel || !scrollContainer) return;
		const observer = new IntersectionObserver(
			async (entries) => {
				const entry = entries[0];
				if (!entry.isIntersecting || dmHistoryState.isLoading || !dmHistoryState.hasMore) return;
				const prevScrollHeight = scrollContainer!.scrollHeight;
				await loadMoreDmHistory();
				requestAnimationFrame(() => {
					if (scrollContainer)
						scrollContainer.scrollTop = scrollContainer.scrollHeight - prevScrollHeight;
				});
			},
			{ root: scrollContainer, threshold: 0.1 }
		);
		observer.observe(topSentinel);
		return () => observer.disconnect();
	});

	const formatTime = (ts: number) =>
		new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

	function formatDate(ts: number): string {
		const d = new Date(ts);
		const now = new Date();
		const isToday =
			d.getDate() === now.getDate() &&
			d.getMonth() === now.getMonth() &&
			d.getFullYear() === now.getFullYear();
		if (isToday) return 'Today';
		const yesterday = new SvelteDate(now);
		yesterday.setDate(now.getDate() - 1);
		const isYesterday =
			d.getDate() === yesterday.getDate() &&
			d.getMonth() === yesterday.getMonth() &&
			d.getFullYear() === yesterday.getFullYear();
		if (isYesterday) return 'Yesterday';
		return d.toLocaleDateString([], {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
		});
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	// Code snippet detection
	function parseCodeSnippet(
		text: string
	): { code: string; language: string; theme: string } | null {
		const match = text.trim().match(/^```(\w+)(?:\s+theme:([\w-]+))?\n([\s\S]*?)```$/);
		if (!match) return null;

		return {
			language: match[1] || 'plaintext',
			theme:
				match[2] ??
				(window.matchMedia('(prefers-color-scheme: dark)').matches
					? 'tokyo-night'
					: 'catppuccin-latte'),
			code: match[3]
		};
	}

	type BubbleGroup = {
		userId: string;
		displayName: string;
		userProfileImage?: string | null;
		userBannerImage?: string | null;
		isLocal: boolean;
		msgs: typeof dmMessages.current;
	};

	type DateGroup = {
		dateLabel: string;
		bubbleGroups: BubbleGroup[];
	};

	let groupedMessages = $derived.by(() => {
		const dateGroups: DateGroup[] = [];
		let currentDateLabel = '';
		let currentBubble: BubbleGroup | null = null;
		for (const msg of dmMessages.current) {
			const dateLabel = formatDate(msg.timestamp);
			const isMine = msg.userId === currentUserId;
			if (dateLabel !== currentDateLabel) {
				currentDateLabel = dateLabel;
				currentBubble = null;
				dateGroups.push({ dateLabel, bubbleGroups: [] });
			}
			const currentDateGroup = dateGroups[dateGroups.length - 1];
			if (!currentBubble || currentBubble.userId !== msg.userId) {
				currentBubble = {
					userId: msg.userId,
					displayName: msg.displayName,
					userProfileImage: msg.userProfileImage,
					userBannerImage: msg.userBannerImage,
					isLocal: isMine,
					msgs: []
				};
				currentDateGroup.bubbleGroups.push(currentBubble);
			}
			currentBubble.msgs.push(msg);
		}
		return dateGroups;
	});
</script>

<div
	bind:this={scrollContainer}
	class="flex flex-1 flex-col overflow-y-auto scroll-smooth px-4 py-2"
>
	<div bind:this={topSentinel} class="h-1 w-full shrink-0"></div>

	<div class="flex min-h-6 items-center justify-center py-1">
		{#if dmHistoryState.isLoading}
			<div class="flex items-center gap-2 text-xs text-zinc-400">
				<Loader class="size-3 animate-spin" />
				Loading messages…
			</div>
		{:else if !dmHistoryState.hasMore && dmMessages.current.length > 0}
			<p class="text-xs text-zinc-400">Beginning of conversation</p>
		{/if}
	</div>

	{#if dmMessages.current.length === 0 && !dmHistoryState.isLoading}
		<div class="flex flex-1 items-center justify-center text-sm text-zinc-400">
			No messages yet. Say hello!
		</div>
	{/if}

	{#each groupedMessages as dateGroup (dateGroup.dateLabel)}
		<div class="my-4 flex items-center gap-3">
			<div class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
			<span
				class="rounded-full bg-zinc-100 px-3 py-0.5 text-[11px] font-medium
   	  	  	             text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
			>
				{dateGroup.dateLabel}
			</span>
			<div class="h-px flex-1 bg-zinc-200 dark:bg-zinc-700"></div>
		</div>

		{#each dateGroup.bubbleGroups as bubbleGroup (bubbleGroup.userId + bubbleGroup.msgs[0]?.dmMessageId)}
			{@const isMine = bubbleGroup.isLocal}

			<div class="mb-3 flex w-full gap-2 {isMine ? 'flex-row-reverse' : 'flex-row'}">
				<div class="mt-auto shrink-0">
					{#if !isMine}
						<div
							class="size-8 overflow-hidden rounded-full bg-zinc-700
				                           ring-2 ring-transparent transition-all"
						>
							{#if bubbleGroup.userProfileImage}
								<img
									src={bubbleGroup.userProfileImage}
									alt={bubbleGroup.displayName}
									class="size-full object-cover"
								/>
							{:else}
								<div
									class="flex size-full items-center justify-center text-xs font-bold text-white"
								>
									{bubbleGroup.displayName?.[0]?.toUpperCase() ?? '?'}
								</div>
							{/if}
						</div>
					{:else}
						<div class="size-8"></div>
					{/if}
				</div>

				<div class="flex max-w-[75%] flex-col gap-0.5 {isMine ? 'items-end' : 'items-start'}">
					{#if !isMine}
						<span class="mb-0.5 px-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
							{bubbleGroup.displayName}
						</span>
					{/if}

					{#each bubbleGroup.msgs as msg, i (msg.dmMessageId ?? msg.timestamp)}
						{@const isFirst = i === 0}
						{@const isLast = i === bubbleGroup.msgs.length - 1}
						{@const hasFile = !!msg.messageFileUrl}
						{@const isImageFile = msg.messageFileType?.startsWith('image/') ?? false}
						{@const snippet = parseCodeSnippet(msg.message)}
						{@const hasText = !!msg.message && !snippet}

						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="flex flex-col {isMine ? 'items-end' : 'items-start'}"
							oncontextmenu={(e) => showContextMenu(e, msg, isMine)}
							ondblclick={(e) => showContextMenu(e, msg, isMine)}
						>
							{#if hasFile}
								{#if isImageFile}
									<div
										class="group relative mb-0.5 overflow-hidden rounded-xl shadow-sm
                                            {isMine ? 'rounded-br-sm' : 'rounded-bl-sm'}
                                            max-w-xs border border-zinc-200 dark:border-zinc-700"
									>
										<img
											src={msg.messageFileUrl}
											alt={msg.messageFileName ?? 'Image'}
											class="block max-h-64 w-full object-cover"
											loading="lazy"
										/>
										<a
											href={resolve(msg.messageFileUrl)}
											download={msg.messageFileName}
											target="_blank"
											rel="noopener noreferrer"
											aria-label="Download image"
											class="absolute inset-0 flex items-center justify-center
                                              bg-black/0 opacity-0 transition-all
                                              group-hover:bg-black/30 group-hover:opacity-100"
										>
											<div class="rounded-full bg-white/90 p-2 shadow">
												<Download class="size-4 text-zinc-700" />
												{#if msg.messageFileSize != null}
													<span
														class="text-red-600 opacity-0 transition-opacity group-hover:opacity-100"
													>
														· {formatBytes(msg.messageFileSize)}
													</span>
												{/if}
											</div>
										</a>
									</div>
								{:else}
									<a
										href={resolve(msg.messageFileUrl)}
										download={msg.messageFileName}
										target="_blank"
										rel="noopener noreferrer"
										class="group mb-0.5 flex items-center gap-2.5 rounded-xl border px-3 py-2
                                          no-underline shadow-sm transition-colors
                                          {isMine
											? 'rounded-br-sm border-indigo-500/40 bg-indigo-700 text-white hover:bg-indigo-600'
											: 'rounded-bl-sm border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600'}"
									>
										<div
											class="flex size-8 shrink-0 items-center justify-center rounded-md
                                                {isMine
												? 'bg-indigo-500/40'
												: 'bg-zinc-100 dark:bg-zinc-600'}"
										>
											<FileIcon
												class="size-4 {isMine ? 'text-white' : 'text-zinc-500 dark:text-zinc-300'}"
											/>
										</div>
										<div class="min-w-0">
											<p class="max-w-40 truncate text-xs font-medium">
												{msg.messageFileName ?? 'File'}
											</p>
											<p class="flex items-center gap-1 text-[10px] opacity-60">
												<Download class="size-2.5" />
												Download
												{#if msg.messageFileSize != null}
													<span
														class="text-amber-500 opacity-0 transition-opacity group-hover:opacity-100"
													>
														· {formatBytes(msg.messageFileSize)}
													</span>
												{/if}
											</p>
										</div>
									</a>
								{/if}
							{/if}

							<!-- Code snippet -->
							{#if snippet}
								<div class="w-full min-w-64">
									<CodeBlock
										code={snippet.code}
										language={snippet.language}
										theme={snippet.theme}
										{isMine}
									/>
								</div>
							{/if}

							<!-- Plain text bubble -->
							{#if hasText}
								<div
									class="px-4 py-2 text-sm leading-relaxed
   	  	      	  	  	               {isMine
										? 'bg-indigo-600 text-white'
										: 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'}
   	  	      	  	  	               {isMine
										? isFirst && isLast
											? 'rounded-2xl rounded-br-sm'
											: isFirst
												? 'rounded-2xl rounded-br-sm'
												: isLast
													? 'rounded-2xl rounded-tr-sm rounded-br-sm'
													: 'rounded-2xl rounded-r-sm'
										: isFirst && isLast
											? 'rounded-2xl rounded-bl-sm'
											: isFirst
												? 'rounded-2xl rounded-bl-sm'
												: isLast
													? 'rounded-2xl rounded-tl-sm rounded-bl-sm'
													: 'rounded-2xl rounded-l-sm'}"
								>
									{msg.message}
								</div>
							{/if}

							{#if isLast}
								<span class="mt-0.5 px-1 text-[10px] text-zinc-400">
									{formatTime(msg.timestamp)}
								</span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	{/each}

	<div bind:this={bottomEl}></div>
</div>

{#if contextMenu.show}
	<MessageContextMenu
		x={contextMenu.x}
		y={contextMenu.y}
		messageText={contextMenu.messageText}
		isMine={contextMenu.isMine}
		onDelete={handleDeleteMessage}
		onClose={() => (contextMenu.show = false)}
	/>
{/if}
