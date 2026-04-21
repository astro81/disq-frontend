<!-- MessageContextMenu.svelte -->
<script lang="ts">
	import { Copy, Trash2 } from '@lucide/svelte';

	interface Props {
		x: number;
		y: number;
		messageText: string;
		isMine: boolean;
		onDelete: () => void;
		onClose: () => void;
	}

	let { x, y, messageText, isMine, onDelete, onClose }: Props = $props();

	let menuEl: HTMLDivElement | undefined = $state();
	let copied = $state(false);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(messageText);
			copied = true;
			setTimeout(() => {
				copied = false;
				onClose();
			}, 800);
		} catch {
			console.error('Failed to copy to clipboard');
		}
	}

	function handleDelete() {
		onDelete();
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	function handleClickOutside(e: MouseEvent) {
		if (menuEl && !menuEl.contains(e.target as Node)) {
			onClose();
		}
	}

	$effect(() => {
		// Attach on next tick so the triggering click doesn't immediately close
		const timer = setTimeout(() => {
			document.addEventListener('click', handleClickOutside, true);
			document.addEventListener('keydown', handleKeydown, true);
		}, 0);

		return () => {
			clearTimeout(timer);
			document.removeEventListener('click', handleClickOutside, true);
			document.removeEventListener('keydown', handleKeydown, true);
		};
	});

	// Keep menu within viewport bounds
	let adjustedX = $derived(Math.min(x, window.innerWidth - 180));
	let adjustedY = $derived(Math.min(y, window.innerHeight - 120));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={menuEl}
	class="context-menu"
	style="left: {adjustedX}px; top: {adjustedY}px;"
>
	<button class="context-menu-item" onclick={handleCopy}>
		<Copy class="size-4" />
		{copied ? 'Copied!' : 'Copy Message'}
	</button>

	{#if isMine}
		<div class="context-menu-divider"></div>
		<button class="context-menu-item danger" onclick={handleDelete}>
			<Trash2 class="size-4" />
			Delete Message
		</button>
	{/if}
</div>

<style>
	.context-menu {
		position: fixed;
		z-index: 1000;
		min-width: 160px;
		padding: 6px;
		border-radius: 10px;
		background: rgba(30, 30, 40, 0.95);
		backdrop-filter: blur(16px);
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.4),
			0 2px 8px rgba(0, 0, 0, 0.2);
		animation: context-menu-in 0.15s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes context-menu-in {
		from {
			opacity: 0;
			transform: scale(0.92);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.context-menu-item {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 8px 12px;
		border: none;
		border-radius: 6px;
		background: transparent;
		color: #e4e4e7;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.12s ease, color 0.12s ease;
	}

	.context-menu-item:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #fff;
	}

	.context-menu-item.danger {
		color: #f87171;
	}

	.context-menu-item.danger:hover {
		background: rgba(239, 68, 68, 0.15);
		color: #fca5a5;
	}

	.context-menu-divider {
		height: 1px;
		margin: 4px 8px;
		background: rgba(255, 255, 255, 0.06);
	}
</style>
