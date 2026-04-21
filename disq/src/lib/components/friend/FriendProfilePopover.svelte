<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { UserMinus, Loader2, Mail, Hash } from '@lucide/svelte';
	import { getFriendshipStatus, removeFriend } from '$lib/remote/friend/friend.remote';
	import { invalidateAll, goto } from '$app/navigation';

	interface Props {
		userId: string;
		username: string;
		displayName: string;
		email: string;
		userProfileImage?: string | null;
		userBannerImage?: string | null;
		children: import('svelte').Snippet;
	}

	let { userId, username, displayName, email, userProfileImage, userBannerImage, children }: Props =
		$props();

	let friendStatus = $state<{
		status: string;
		friendshipId: string | null;
		isRequester: boolean;
	} | null>(null);
	let loadingStatus = $state(false);

	async function fetchStatus() {
		if (!userId) return;
		loadingStatus = true;
		try {
			friendStatus = await getFriendshipStatus({ targetUserId: userId }).run();
		} catch (e) {
			console.error('Failed to fetch friendship status:', e);
		} finally {
			loadingStatus = false;
		}
	}

	$effect(() => {
		if (userId) {
			fetchStatus();
		}
	});

	async function handleRemoveFriend() {
		if (!friendStatus?.friendshipId) return;
		if (!confirm('Are you sure you want to remove this friend?')) return;

		loadingStatus = true;
		try {
			const res = await removeFriend({ friendshipId: friendStatus.friendshipId }).run();
			if (res.success) {
				await invalidateAll();
				await goto('/servers/friends');
			}
		} catch (e) {
			console.error('Failed to remove friend:', e);
		} finally {
			loadingStatus = false;
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text).catch(() => null);
	}
</script>

<Popover.Root>
	<Popover.Trigger>
		{@render children()}
	</Popover.Trigger>

	<Popover.Content class="w-80 overflow-hidden p-0" side="bottom" align="start" sideOffset={8}>
		<!-- Banner -->
		<div class="h-20 bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500">
			{#if userBannerImage}
				<img src={userBannerImage} alt={displayName} class="h-full w-full object-cover" />
			{/if}
		</div>

		<!-- Avatar overlapping banner -->
		<div class="-mt-10 flex items-end justify-between px-4 pb-2">
			<Avatar.Root class="size-20 ring-4 ring-background">
				<Avatar.Image src={userProfileImage ?? undefined} alt={displayName} />
				<Avatar.Fallback class="bg-zinc-700 text-xl font-bold text-white">
					{displayName?.[0]?.toUpperCase() ?? '?'}
				</Avatar.Fallback>
			</Avatar.Root>
		</div>

		<!-- Info -->
		<div class="flex flex-col gap-4 px-4 pt-2 pb-6">
			<div>
				<h3 class="text-lg leading-tight font-bold">{displayName}</h3>
				<p class="text-sm text-muted-foreground">@{username}</p>
			</div>

			<div class="space-y-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/50">
				<!-- Email -->
				<div class="flex flex-col gap-1">
					<p
						class="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-zinc-500 uppercase"
					>
						<Mail class="size-3" />
						Email
					</p>
					<p class="text-xs break-all">{email}</p>
				</div>
			</div>

			<!-- Actions -->
			<div class="mt-2">
				{#if loadingStatus}
					<button
						disabled
						class="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-400 dark:bg-zinc-800"
					>
						<Loader2 class="size-3.5 animate-spin" />
						Loading...
					</button>
				{:else if friendStatus?.status === 'ACCEPTED'}
					<button
						onclick={handleRemoveFriend}
						class="flex w-full items-center justify-center gap-2 rounded-md bg-red-100 px-3 py-2
							text-xs font-bold text-red-700 transition-colors hover:bg-red-200
							dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60"
					>
						<UserMinus class="size-4" />
						Remove Friend
					</button>
				{:else if friendStatus?.status === 'PENDING'}
					<p
						class="rounded-md bg-zinc-50 py-2 text-center text-xs font-medium text-muted-foreground dark:bg-zinc-900/40"
					>
						Friend Request Pending
					</p>
				{:else if friendStatus?.status === 'NONE'}
					<p
						class="rounded-md bg-zinc-50 py-2 text-center text-xs text-muted-foreground italic dark:bg-zinc-900/40"
					>
						You are not friends with this user.
					</p>
				{:else}
					<p class="text-center text-xs text-muted-foreground italic">
						Updating friendship status...
					</p>
				{/if}
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
