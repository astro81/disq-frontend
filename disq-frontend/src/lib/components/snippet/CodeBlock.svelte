<!-- CodeBlock.svelte -->
<!--
    Renders a fenced code block with Shiki syntax highlighting.
    Uses a lazy highlight strategy:
      - Shows the raw code immediately (no flash of unstyled content)
      - Replaces it with the highlighted HTML once Shiki resolves
-->
<script lang="ts">
	import { Copy, Check } from '@lucide/svelte';
	import { highlightCode, PRELOADED_LANGS } from '$lib/utils/shiki';
	import { mode } from 'mode-watcher';

	interface Props {
		code: string;
		language: string;
		theme?: string;
		isMine?: boolean;
	}

	let { code, language, theme, isMine = false }: Props = $props();

	const formatThemeLabel = (themeName: string): string => {
		return themeName
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	// Fall back to system preference when no theme is supplied by the parent
	let systemTheme = $derived.by(() =>
		mode.current === 'light' ? 'catppucing-latte' : 'tokyo-night'
	);

	const resolvedTheme = $derived(theme ?? systemTheme);

	const themeLabel = $derived(formatThemeLabel(resolvedTheme));

	let highlightedHtml = $state<string | null>(null);
	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout>;

	// Format language names: capitalize first letter
	const formatLangLabel = (lang: string): string => {
		return lang.charAt(0).toUpperCase() + lang.slice(1);
	};

	// Generate LANG_LABELS dynamically
	const LANG_LABELS = Object.fromEntries(
		PRELOADED_LANGS.map((lang) => [lang, formatLangLabel(lang)])
	);

	const langLabel = $derived(LANG_LABELS[language] ?? language);

	// Shiki highlight - runs once on mount, re-runs if code/language changes
	$effect(() => {
		const currentCode = code;
		const currentLang = language;
		const currentTheme = resolvedTheme;

		highlightCode(currentCode, currentLang, currentTheme)
			.then((html) => {
				highlightedHtml = html;
			})
			.catch(() => {
				highlightedHtml = `<pre><code>${escapeHtml(currentCode)}</code></pre>`;
			});
	});

	function escapeHtml(str: string): string {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	async function copyCode() {
		try {
			await navigator.clipboard.writeText(code);
			copied = true;
			clearTimeout(copyTimer);
			copyTimer = setTimeout(() => (copied = false), 2000);
		} catch {
			// clipboard not available
		}
	}
</script>

<div
	class="group my-0.5 overflow-hidden rounded-xl border text-left
           {isMine
		? 'border-indigo-500/30 bg-indigo-950/40'
		: 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60'}"
>
	<!-- Toolbar -->
	<div
		class="flex items-center justify-between border-b px-3 py-1.5
               {isMine
			? 'border-indigo-500/20 bg-indigo-950/30'
			: 'border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800'}"
	>
		<div class="flex items-center justify-start gap-2">
			<span
				class="text-[11px] font-medium {isMine
					? 'text-indigo-300'
					: 'text-zinc-500 dark:text-zinc-400'}"
			>
				{langLabel}
			</span>

			<span
				class="text-[10px] font-medium opacity-60 {isMine
					? 'text-indigo-300'
					: 'text-zinc-400 dark:text-zinc-500'}"
			>
				{themeLabel}
			</span>
		</div>

		<button
			type="button"
			onclick={copyCode}
			aria-label="Copy code"
			class="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] transition-colors
                   {isMine
				? 'text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-100'
				: 'text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-200'}"
		>
			{#if copied}
				<Check class="size-3" />
				Copied
			{:else}
				<Copy class="size-3" />
				Copy
			{/if}
		</button>
	</div>

	<!-- Code area -->
	<div class="overflow-x-auto text-[13px] leading-6">
		{#if highlightedHtml}
			<!--
                Shiki outputs a full <pre><code>…</code></pre> with inline styles.
                We override its background to stay transparent so our own
                background (set on the outer div) shows through correctly in both
                light and dark modes.
            -->
			<div class="shiki-wrapper {isMine ? 'shiki-mine' : ''}">
				{@html highlightedHtml}
			</div>
		{:else}
			<!-- Raw code while Shiki is loading -->
			<pre
				class="m-0 overflow-x-auto px-4 py-3 font-mono whitespace-pre
                       {isMine
					? 'text-indigo-200'
					: 'text-zinc-800 dark:text-zinc-200'}">{code}</pre>
		{/if}
	</div>
</div>

<style>
	/* Strip Shiki's own background so our container bg shows through */
	.shiki-wrapper :global(pre) {
		background: transparent !important;
		margin: 0;
		padding: 0.75rem 1rem;
		overflow-x: auto;
		white-space: pre;
	}

	.shiki-wrapper :global(code) {
		font-size: 13px;
		font-family: var(--font-mono, ui-monospace, 'Cascadia Code', 'Fira Code', monospace);
		line-height: 1.5rem;
	}

	/*
     * When the snippet is inside an "own" (indigo) bubble,
     * force all Shiki token colors to a light variant so they stay
     * readable on the dark indigo background.
     */
	.shiki-mine :global(.shiki) {
		color: #c9d1d9 !important; /* github-dark baseline */
	}
</style>
