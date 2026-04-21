<script lang="ts">
	import type { PageProps } from './$types';
	import { connectToDm, disconnectDm, dmSocketState } from '$lib/stores/dm-socket.svelte';
	import DmChatMessages from '$lib/components/chat/DmChatMessages.svelte';
	import DmChatInput from '$lib/components/chat/DmChatInput.svelte';
	import FriendProfilePopover from '$lib/components/friend/FriendProfilePopover.svelte';

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
</script>

<div class="flex h-screen flex-col">
	<!-- DM Header -->
	<div class="flex h-12 items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
		<FriendProfilePopover
			userId={friendUser.id}
			username={friendUser.name}
			displayName={friendUser.displayName}
			email={friendUser.email}
			userProfileImage={friendUser.image}
			userBannerImage={friendUser.profileBannerImage}
		>
			<button class="flex items-center transition-opacity hover:opacity-80">
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
			</button>
		</FriendProfilePopover>
		{#if dmSocketState.current === 'connecting'}
			<span class="ml-auto text-xs text-yellow-500">Connecting...</span>
		{:else if dmSocketState.current === 'error'}
			<span class="ml-auto text-xs text-red-500">Connection error</span>
		{/if}
	</div>

	<!-- Messages area -->
	<DmChatMessages currentUserId={currentUser?.id ?? ''} />

	<!-- Chat input -->
	<DmChatInput friendName={friendUser?.displayName ?? 'friend'} />
</div>
