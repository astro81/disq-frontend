<script lang="ts">
	import { socketState } from '$lib/stores/socket.svelte';

	const states = {
		open: { label: 'Connected', dot: 'bg-emerald-500', bg: 'bg-emerald-600' },
		connecting: { label: 'Connecting…', dot: 'bg-yellow-400 animate-pulse', bg: 'bg-yellow-600' },
		closed: { label: 'Disconnected', dot: 'bg-zinc-400', bg: 'bg-zinc-600' },
		error: { label: 'Error', dot: 'bg-red-400', bg: 'bg-red-600' }
	};

	let current = $derived(states[socketState.current] ?? states.closed);
</script>

<div class="flex h-6 items-center gap-2 rounded-xl {current.bg} px-3 py-1 text-xs text-white">
	<span class="size-2 rounded-full {current.dot}"></span>
	{current.label}
</div>
