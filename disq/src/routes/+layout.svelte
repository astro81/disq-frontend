<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { setUserState } from '$lib/stores/user-state.svelte';
	import { initNotifications, notifications } from '$lib/stores/notification.svelte';
	import NotificationToast from '$lib/components/notifications/NotificationToast.svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	let userState = setUserState();
	userState.user = data.user ?? null;

	$effect(() => {
		if (data.user) {
			userState.add(data.user);
			initNotifications(data.user.id);
		} else {
			userState.remove();
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}

<div class="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-y-2">
	{#each notifications.current as notification (notification.id)}
		<NotificationToast {notification} />
	{/each}
</div>
