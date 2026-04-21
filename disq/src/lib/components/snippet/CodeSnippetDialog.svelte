<script lang="ts">
    import { PRELOADED_LANGS, PRELOADED_THEMES } from '$lib/utils/shiki';
    import { X, Code, Send } from '@lucide/svelte';
    import { mode } from 'mode-watcher';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Button, buttonVariants } from '$lib/components/ui/button';
    import { cn } from '$lib/utils';

    interface Props {
        open: boolean;
        onSend: (code: string, language: string, theme: string) => void;
    }

    let { open = $bindable(), onSend }: Props = $props();

    const LANGUAGES = PRELOADED_LANGS.map((lang) => ({
        value: lang,
        label: lang.charAt(0).toUpperCase() + lang.slice(1)
    }));

    const formatThemeLabel = (theme: string): string => {
        return theme
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const THEME_LABELS = Object.fromEntries(
        PRELOADED_THEMES.map((theme) => [theme, formatThemeLabel(theme)])
    );

    let selectedLang = $state('typescript');
    let selectedTheme = $state('tokyo-night');

    let code = $state('');
    let textareaEl: HTMLTextAreaElement | undefined = $state();

    // Update theme based on system preference when modal opens
    $effect(() => {
        if (open) {
            code = '';
            selectedLang = 'typescript';
            selectedTheme = mode.current === 'light' ? 'catppuccin-latte' : 'tokyo-night';

            setTimeout(() => textareaEl?.focus(), 50);
        }
    });

    function handleSend() {
        const trimmed = code.trim();
        if (!trimmed) return;
        onSend(trimmed, selectedLang, selectedTheme);
        open = false;
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = textareaEl!.selectionStart;
            const end = textareaEl!.selectionEnd;
            code = code.slice(0, start) + '  ' + code.slice(end);
            requestAnimationFrame(() => {
                textareaEl!.selectionStart = textareaEl!.selectionEnd = start + 2;
            });
        }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSend();
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="flex max-w-7xl min-w-250 flex-col gap-0 p-0 overflow-hidden sm:rounded-2xl [&>button]:-translate-y-1.5">
        <div class="flex shrink-0 items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <Code class="size-4 text-indigo-500" />
            <Dialog.Title class="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                Code snippet
            </Dialog.Title>

            <div class="ml-auto flex items-center gap-2 mr-10">
                <select
                        bind:value={selectedLang}
                        class="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                    {#each LANGUAGES as lang (lang.value)}
                        <option value={lang.value}>{lang.label}</option>
                    {/each}
                </select>

                <select
                        bind:value={selectedTheme}
                        class="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                    {#each PRELOADED_THEMES as theme (theme)}
                        <option value={theme}>{THEME_LABELS[theme] ?? theme}</option>
                    {/each}
                </select>
            </div>
        </div>

        <div class="relative flex-1 bg-white dark:bg-zinc-900">
            <div
                    class="pointer-events-none absolute bottom-0 left-0 top-0 flex w-10 select-none flex-col border-r border-zinc-200/60 bg-zinc-50 pt-3 dark:border-zinc-700/60 dark:bg-zinc-800/60"
                    aria-hidden="true"
            >
                {#each { length: Math.max(10, code.split('\n').length) } as _, i (i)}
					<span class="block pr-2 text-right text-[11px] leading-6 text-zinc-300 dark:text-zinc-600">
						{i + 1}
					</span>
                {/each}
            </div>

            <textarea
                    bind:this={textareaEl}
                    bind:value={code}
                    onkeydown={handleKeydown}
                    placeholder="Paste or type your code here…"
                    spellcheck="false"
                    class="size-full min-h-200 min-w-250 resize-none bg-transparent pb-3 pl-12 pr-4 pt-3 font-mono text-[13px] leading-6 text-zinc-800 outline-none placeholder:text-zinc-300 dark:text-zinc-200 dark:placeholder:text-zinc-600"
            ></textarea>
        </div>

        <div class="flex shrink-0 items-center justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <span class="text-[11px] text-zinc-400"> Tab to indent · ⌘↵ to send </span>

            <button
                    type="button"
                    onclick={handleSend}
                    disabled={!code.trim()}
                    class={cn(buttonVariants({ size: 'sm' }), 'bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5')}
            >
                <Send class="size-3.5" />
                Send snippet
            </button>
        </div>
    </Dialog.Content>
</Dialog.Root>