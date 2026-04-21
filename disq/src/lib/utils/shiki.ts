import {
	createHighlighter,
	type BundledLanguage,
	type BundledTheme,
	type Highlighter
} from 'shiki';

export const PRELOADED_LANGS = [
	'angular-html',
	'angular-ts',
	'asm',
	'c',
	'cpp',
	'csharp',
	'css',
	'csv',
	'dart',
	'docker',
	'elixir',
	'go',
	'haskell',
	'html',
	'java',
	'javascript',
	'json',
	'jsx',
	'kotlin',
	'lua',
	'matlab',
	'nginx',
	'nix',
	'php',
	'python',
	'razor',
	'rust',
	'svelte',
	'tsx',
	'typescript',
	'zig'
] as BundledLanguage[];

export const PRELOADED_THEMES = [
	'github-dark',
	'github-light',
	'nord',
	'one-dark-pro',
	'catppuccin-frappe',
	'catppuccin-latte',
	'catppuccin-macchiato',
	'catppuccin-mocha',
	'dracula',
	'dracula-soft',
	'gruvbox-dark-soft',
	'kanagawa-dragon',
	'tokyo-night'
] as BundledTheme[];

let highlighter: Highlighter | null = null;

export async function getHighlighter() {
	if (highlighter) return highlighter;

	highlighter = await createHighlighter({
		themes: PRELOADED_THEMES,
		langs: PRELOADED_LANGS
	});

	return highlighter;
}

/**
 * @param theme - Must be one of the PRELOADED_THEMES
 */
export async function highlightCode(code: string, lang: string, theme: string) {
	const shiki = await getHighlighter();

	// Fallback for languages not in your list or 'plaintext'
	const validatedLang = PRELOADED_LANGS.includes(lang as BundledLanguage) ? lang : 'text';

	// Fallback for themes not in your list
	const validatedTheme = PRELOADED_THEMES.includes(theme as BundledTheme) ? theme : 'github-dark';

	return shiki.codeToHtml(code, {
		lang: validatedLang as BundledLanguage,
		theme: validatedTheme as BundledTheme
	});
}
