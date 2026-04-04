<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { UserPlus } from '@lucide/svelte';

	interface Props {
		memberId: string;
		userId: string;
		username: string;
		displayName: string;
		userProfileImage?: string | null;
		userBannerImage?: string | null;
		role?: string | null;
		isLocal?: boolean;
		children: import('svelte').Snippet;
	}

	let {
		memberId,
		userId,
		username,
		displayName,
		userProfileImage,
		userBannerImage,
		role,
		isLocal = false,
		children
	}: Props = $props();

	const roleConfig: Record<string, { label: string; class: string }> = {
		ADMIN: {
			label: 'Admin',
			class: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
		},
		MODERATOR: {
			label: 'Moderator',
			class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
		},
		GUEST: {
			label: 'Member',
			class: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
		}
	};

	let roleInfo = $derived(role ? (roleConfig[role] ?? roleConfig.GUEST) : null);

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).catch(() => null);
	}

	// ── Add Friend logic ──
	let friendRequestState = $state<'idle' | 'loading' | 'sent' | 'already' | 'error'>('idle');

	async function handleAddFriend() {
		if (friendRequestState === 'loading' || friendRequestState === 'sent') return;
		friendRequestState = 'loading';

		try {
			const res = await fetch('/api/friends?action=request', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ addresseeId: userId })
			});

			if (res.ok) {
				friendRequestState = 'sent';
			} else if (res.status === 409) {
				friendRequestState = 'already';
			} else {
				friendRequestState = 'error';
			}
		} catch {
			friendRequestState = 'error';
		}
	}

	const friendButtonLabel = $derived(
		friendRequestState === 'loading'
			? 'Sending...'
			: friendRequestState === 'sent'
				? 'Request Sent!'
				: friendRequestState === 'already'
					? 'Already Friends'
					: friendRequestState === 'error'
						? 'Error'
						: 'Add Friend'
	);
</script>

<Popover.Root>
	<Popover.Trigger>
		{@render children()}
	</Popover.Trigger>

	<Popover.Content class="w-72 overflow-hidden p-0" side="right" align="start" sideOffset={8}>
		<!-- Banner / header gradient -->
		<div class="h-16 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500">
			{#if userBannerImage}
				<img src={userBannerImage} alt={displayName} class="h-full w-full object-cover" />
			{/if}
		</div>

		<!-- Avatar overlapping banner -->
		<div class="-mt-8 flex items-end justify-between px-4">
			<Avatar.Root class="size-16 ring-4 ring-background">
				<Avatar.Image src={userProfileImage ?? undefined} alt={displayName} />
				<Avatar.Fallback class="bg-zinc-700 text-lg font-bold text-white">
					{displayName?.[0]?.toUpperCase() ?? '?'}
				</Avatar.Fallback>
			</Avatar.Root>

			{#if isLocal}
				<span
					class="mb-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px]
                             font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
				>
					You
				</span>
			{/if}
		</div>

		<!-- Info -->
		<div class="flex flex-col gap-3 px-4 pt-2 pb-4">
			<!-- Display name + role -->
			<div class="flex items-center justify-between gap-2">
				<div>
					<p class="text-sm leading-tight font-semibold">{displayName}</p>
					<p class="text-xs text-muted-foreground">@{username}</p>
				</div>
				{#if roleInfo}
					<span class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium {roleInfo.class}">
						{roleInfo.label}
					</span>
				{/if}
			</div>

			<!-- Add Friend button (hidden for self) -->
			{#if !isLocal}
				<button
					onclick={handleAddFriend}
					disabled={friendRequestState === 'loading' ||
						friendRequestState === 'sent' ||
						friendRequestState === 'already'}
					class="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5
						text-xs font-medium text-white transition-colors hover:bg-indigo-700
						disabled:cursor-not-allowed disabled:opacity-50"
				>
					<UserPlus class="size-3.5" />
					{friendButtonLabel}
				</button>
			{/if}

			<div class="h-px bg-border"></div>

			<!-- IDs -->
			<div class="flex flex-col gap-2">
				<button
					onclick={() => copyToClipboard(userId)}
					class="group flex items-center justify-between rounded-md px-2 py-1.5
                           text-left transition-colors hover:bg-muted"
					title="Click to copy"
				>
					<div>
						<p class="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
							User ID
						</p>
						<p class="max-w-45 truncate font-mono text-xs">{userId}</p>
					</div>
					<span
						class="text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
					>
						Copy
					</span>
				</button>

				<button
					onclick={() => copyToClipboard(memberId)}
					class="group flex items-center justify-between rounded-md px-2 py-1.5
                           text-left transition-colors hover:bg-muted"
					title="Click to copy"
				>
					<div>
						<p class="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
							Member ID
						</p>
						<p class="max-w-45 truncate font-mono text-xs">{memberId}</p>
					</div>
					<span
						class="text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
					>
						Copy
					</span>
				</button>
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
