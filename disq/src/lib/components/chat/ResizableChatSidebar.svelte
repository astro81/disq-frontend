<!-- src/lib/components/chat/ResizableChatSidebar.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		minWidth?: number;
		maxWidthRatio?: number; // 0.5 for 50%
		className?: string;
	}

	let {
		children,
		minWidth = 288, // w-72 equivalent
		maxWidthRatio = 0.5,
		className = ''
	} = $props();

	let width = $state(420);
	let isResizing = $state(false);

	$effect(() => {
		if (isResizing) {
			document.body.classList.add('resizing');
		} else {
			document.body.classList.remove('resizing');
		}
	});

	function startResizing(e: MouseEvent) {
		isResizing = true;
		e.preventDefault();
	}

	function stopResizing() {
		isResizing = false;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isResizing) return;

		// The sidebar is pinned to the right.
		// Current width is (viewport width - current mouse X position)
		const newWidth = window.innerWidth - e.clientX;
		const maxWidth = window.innerWidth * maxWidthRatio;

		if (newWidth >= minWidth && newWidth <= maxWidth) {
			width = newWidth;
		} else if (newWidth < minWidth) {
			width = minWidth;
		} else if (newWidth > maxWidth) {
			width = maxWidth;
		}
	}

	onMount(() => {
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', stopResizing);

		return () => {
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', stopResizing);
		};
	});
</script>

<div
	class={cn(
		'relative flex flex-col border-l border-zinc-800 bg-zinc-950',
		!isResizing && 'transition-[width] duration-75 ease-linear',
		className
	)}
	style="width: {width}px;"
>
	<!-- Resize Handle -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class={cn(
			'absolute top-0 bottom-0 left-0 w-1.5 cursor-ew-resize transition-colors hover:bg-indigo-500/50 active:bg-indigo-500',
			isResizing ? 'bg-indigo-500' : 'bg-transparent'
		)}
		onmousedown={startResizing}
	>
		<!-- Optional: Visual indicator for the handle -->
		<div
			class="absolute top-1/2 left-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-700/50"
		></div>
	</div>

	<!-- Content -->
	<div class="flex flex-1 flex-col overflow-hidden">
		{@render children()}
	</div>
</div>

<style>
	/* Prevent text selection while resizing */
	:global(body.resizing) {
		cursor: ew-resize;
		user-select: none;
	}
</style>
