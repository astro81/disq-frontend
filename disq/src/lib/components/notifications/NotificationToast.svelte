<script lang="ts">
	import { onMount } from 'svelte';
	import { notifications, type AppNotification } from '$lib/stores/notification.svelte';
	import { UserPlus, CheckCircle2, X } from '@lucide/svelte';
	import { fly } from 'svelte/transition';

	interface Props {
		notification: AppNotification;
	}

	let { notification }: Props = $props();

	onMount(() => {
		const timer = setTimeout(() => {
			notifications.remove(notification.id);
		}, 5000);
		return () => clearTimeout(timer);
	});
</script>

<div
	in:fly={{ y: 20, duration: 300 }}
	out:fly={{ x: 100, duration: 200 }}
	class="pointer-events-auto flex w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900/90 p-4 shadow-xl backdrop-blur-md"
>
	<div class="mr-3 flex-shrink-0">
		{#if notification.type === 'FRIEND_REQUEST_RECEIVED'}
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400"
			>
				<UserPlus class="size-6" />
			</div>
		{:else}
			<div
				class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400"
			>
				<CheckCircle2 class="size-6" />
			</div>
		{/if}
	</div>

	<div class="flex-1 pt-0.5">
		<p class="text-sm font-medium text-white">
			{#if notification.type === 'FRIEND_REQUEST_RECEIVED'}
				Friend Request Received
			{:else}
				Friend Request Accepted
			{/if}
		</p>
		<p class="mt-1 text-xs leading-tight text-zinc-400">
			{#if notification.type === 'FRIEND_REQUEST_RECEIVED'}
				<span class="font-semibold text-zinc-200">{notification.fromUserName}</span> sent you a friend
				request.
			{:else}
				<span class="font-semibold text-zinc-200">{notification.fromUserName}</span> accepted your friend
				request.
			{/if}
		</p>
	</div>

	<div class="ml-4 flex flex-shrink-0">
		<button
			type="button"
			onclick={() => notifications.remove(notification.id)}
			class="inline-flex rounded-md bg-transparent text-zinc-500 hover:text-zinc-300 focus:outline-none"
		>
			<span class="sr-only">Close</span>
			<X class="size-4" />
		</button>
	</div>
</div>
