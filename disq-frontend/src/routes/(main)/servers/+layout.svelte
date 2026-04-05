<!-- (routes)/layout.svelte -->
<script lang="ts">
	import { ModeWatcher } from 'mode-watcher';
	import type { LayoutProps } from './$types';

	import NavigationSidebar from '$lib/components/navigation/NavigationSidebar.svelte';

	let { children }: LayoutProps = $props();
</script>

<ModeWatcher />

<div class="h-full">
	<div class="fixed inset-y-0 z-30 hidden h-full w-18 flex-col md:flex">
		<NavigationSidebar />
	</div>

	<main class="h-full md:pl-18">
		{@render children()}
	</main>
</div>
