<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { Check } from '@lucide/svelte';

	gsap.registerPlugin(ScrollTrigger);

	const codeFeatures = [
		'Syntax highlighting for 50+ languages',
		'One-click copy to clipboard',
		'Collapsible code blocks',
		'Line numbers and word wrap',
		'Dark and light themes',
		'Embed snippets in any message'
	];

	const codeLines = [
		{
			num: '1',
			parts: [
				{ cls: 'text-blue-400', text: 'const' },
				{ cls: 'text-foreground', text: ' snippet ' },
				{ cls: 'text-foreground', text: '=' },
				{ cls: 'text-foreground', text: ' ' },
				{ cls: 'text-accent', text: 'createSnippet' },
				{ cls: 'text-foreground', text: '({' }
			]
		},
		{
			num: '2',
			parts: [
				{ cls: '', text: '  ' },
				{ cls: 'text-foreground', text: 'language:' },
				{ cls: 'text-foreground', text: ' ' },
				{ cls: 'text-green-400', text: "'typescript'" },
				{ cls: 'text-foreground', text: ',' }
			]
		},
		{
			num: '3',
			parts: [
				{ cls: '', text: '  ' },
				{ cls: 'text-foreground', text: 'title:' },
				{ cls: 'text-foreground', text: ' ' },
				{ cls: 'text-green-400', text: "'API Handler'" },
				{ cls: 'text-foreground', text: ',' }
			]
		},
		{
			num: '4',
			parts: [
				{ cls: '', text: '  ' },
				{ cls: 'text-foreground', text: 'code: sourceCode,' }
			]
		},
		{
			num: '5',
			parts: [
				{ cls: '', text: '  ' },
				{ cls: 'text-foreground', text: 'theme:' },
				{ cls: 'text-foreground', text: ' ' },
				{ cls: 'text-green-400', text: "'dark'" }
			]
		},
		{ num: '6', parts: [{ cls: 'text-foreground', text: '})' }] },
		{ num: '7', parts: [{ cls: '', text: '' }] },
		{
			num: '8',
			parts: [
				{ cls: 'text-blue-400', text: 'await' },
				{ cls: 'text-foreground', text: ' channel.' },
				{ cls: 'text-accent', text: 'send' },
				{ cls: 'text-foreground', text: '(snippet)' }
			]
		}
	];

	let sectionEl: HTMLElement;
	let contentEl: HTMLDivElement;
	let editorEl: HTMLDivElement;
	let titleEl: HTMLHeadingElement;
	let featureEls: (HTMLLIElement | null)[] = [];
	let codeLineEls: (HTMLDivElement | null)[] = [];
	let cursorEl: HTMLSpanElement = $state();
	let ctx: gsap.Context;

	onMount(() => {
		ctx = gsap.context(() => {
			// Title kinetic reveal
			gsap.fromTo(
				titleEl,
				{ opacity: 0, y: 100, skewY: 8, transformOrigin: 'left center' },
				{
					opacity: 1,
					y: 0,
					skewY: 0,
					duration: 1.2,
					ease: 'power4.out',
					scrollTrigger: {
						trigger: sectionEl,
						start: 'top 75%',
						toggleActions: 'play none none reverse'
					}
				}
			);

			// Content slide in
			gsap.fromTo(
				contentEl,
				{ opacity: 0, x: -100, rotateY: 10 },
				{
					opacity: 1,
					x: 0,
					rotateY: 0,
					duration: 1.2,
					ease: 'power4.out',
					scrollTrigger: {
						trigger: sectionEl,
						start: 'top 65%',
						toggleActions: 'play none none reverse'
					}
				}
			);

			// Editor cinematic reveal
			gsap.fromTo(
				editorEl,
				{ opacity: 0, x: 100, rotateY: -15, scale: 0.9, transformPerspective: 1000 },
				{
					opacity: 1,
					x: 0,
					rotateY: 0,
					scale: 1,
					duration: 1.2,
					ease: 'power4.out',
					scrollTrigger: {
						trigger: sectionEl,
						start: 'top 65%',
						toggleActions: 'play none none reverse'
					}
				}
			);

			// Feature list stagger with glow effects
			featureEls.forEach((feature, index) => {
				if (!feature) return;
				gsap.fromTo(
					feature,
					{ opacity: 0, x: -30, scale: 0.9, filter: 'blur(4px)' },
					{
						opacity: 1,
						x: 0,
						scale: 1,
						filter: 'blur(0px)',
						duration: 0.6,
						delay: 0.4 + index * 0.08,
						ease: 'back.out(1.5)',
						scrollTrigger: {
							trigger: sectionEl,
							start: 'top 55%',
							toggleActions: 'play none none reverse'
						}
					}
				);
			});

			// Code lines typewriter
			codeLineEls.forEach((line, index) => {
				if (!line) return;
				gsap.fromTo(
					line,
					{ opacity: 0, x: -20, filter: 'blur(5px)' },
					{
						opacity: 1,
						x: 0,
						filter: 'blur(0px)',
						duration: 0.5,
						delay: 0.6 + index * 0.12,
						ease: 'power3.out',
						scrollTrigger: {
							trigger: editorEl,
							start: 'top 65%',
							toggleActions: 'play none none reverse'
						}
					}
				);
			});

			// Blinking cursor
			gsap.to(cursorEl, {
				opacity: 0,
				duration: 0.5,
				repeat: -1,
				yoyo: true,
				ease: 'steps(1)'
			});

			// Parallax
			gsap.to(contentEl, {
				y: -80,
				ease: 'none',
				scrollTrigger: { trigger: sectionEl, start: 'top bottom', end: 'bottom top', scrub: 1 }
			});

			gsap.to(editorEl, {
				y: -40,
				ease: 'none',
				scrollTrigger: { trigger: sectionEl, start: 'top bottom', end: 'bottom top', scrub: 1 }
			});
		}, sectionEl);
	});

	onDestroy(() => ctx?.revert());
</script>

<section
	bind:this={sectionEl}
	id="code-sharing"
	class="overflow-hidden bg-linear-to-b from-background via-background to-background/80 py-32"
>
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="grid items-center gap-16 lg:grid-cols-2">
			<!-- Left content -->
			<div bind:this={contentEl} style="perspective: 1000px">
				<h2
					bind:this={titleEl}
					class="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
				>
					Code sharing
					<span class="text-accent"> that just works</span>
				</h2>
				<p class="mt-6 text-lg leading-relaxed text-muted-foreground lg:text-xl">
					Paste code and it's instantly formatted with beautiful syntax highlighting. Share snippets
					with your team without leaving the conversation.
				</p>

				<ul class="mt-10 space-y-4">
					{#each codeFeatures as feature, index (index)}
						<li
							bind:this={featureEls[index]}
							class="feature-item group relative flex cursor-pointer items-center gap-4 rounded-lg p-2 transition-all duration-300 hover:translate-x-1"
						>
							<!-- Glow background effect -->
							<div
								class="absolute inset-0 rounded-lg bg-accent/0 transition-all duration-500 group-hover:bg-accent/5 group-hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.15)]"
							></div>

							<!-- Glow on hover animation -->
							<div
								class="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500 group-hover:opacity-100"
							>
								<div
									class="absolute inset-0 rounded-lg bg-linear-to-r from-accent/20 via-transparent to-accent/20 blur-xl"
								></div>
							</div>

							<div
								class="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-accent/40 group-hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]"
							>
								<Check class="h-4 w-4 text-accent" />
							</div>
							<span
								class="relative z-10 text-lg text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-foreground"
								>{feature}</span
							>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Right editor -->
			<div
				bind:this={editorEl}
				class="relative"
				style="perspective: 1000px; transform-style: preserve-3d"
			>
				<div
					class="rounded-2xl border border-border bg-card p-1.5 shadow-2xl shadow-accent/5 transition-all duration-500 hover:border-accent/30 hover:shadow-accent/15"
				>
					<div class="rounded-xl bg-background p-6">
						<!-- Editor header -->
						<div class="flex items-center gap-3 border-b border-border pb-4">
							<div class="flex gap-2">
								<div
									class="h-3 w-3 cursor-pointer rounded-full bg-red-500/80 transition-transform hover:scale-125"
								></div>
								<div
									class="h-3 w-3 cursor-pointer rounded-full bg-yellow-500/80 transition-transform hover:scale-125"
								></div>
								<div
									class="h-3 w-3 cursor-pointer rounded-full bg-green-500/80 transition-transform hover:scale-125"
								></div>
							</div>
							<div class="flex-1 text-center">
								<span class="text-sm font-medium text-muted-foreground">snippet-share.ts</span>
							</div>
						</div>

						<!-- Code content -->
						<div class="mt-6 space-y-1 font-mono text-sm">
							{#each codeLines as line, index (index)}
								<div bind:this={codeLineEls[index]} class="flex leading-7">
									<span class="w-8 pr-4 text-right text-muted-foreground/40 select-none"
										>{line.num}</span
									>
									<span>
										{#each line.parts as part (part)}
											<span class={part.cls}>{part.text}</span>
										{/each}
									</span>
									{#if index === codeLines.length - 1}
										<span
											bind:this={cursorEl}
											class="ml-1 inline-block h-5 w-0.5 translate-y-0.5 bg-accent"
										></span>
									{/if}
								</div>
							{/each}
						</div>

						<!-- Status bar -->
						<div class="mt-8 flex items-center justify-between border-t border-border pt-4">
							<div class="flex items-center gap-3">
								<div class="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20">
									<span class="text-xs font-semibold text-accent">TS</span>
								</div>
								<span class="text-sm text-muted-foreground">TypeScript</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="h-2 w-2 animate-pulse rounded-full bg-accent"></span>
								<span class="text-sm text-muted-foreground">Ready to share</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* Add custom CSS variables for RGB values if not already in your global styles */
	:global(:root) {
		--accent-rgb: 99, 102, 241; /* Adjust this to match your accent color */
	}

	/* Optional: Add smooth scroll reveal animations */
	.feature-item {
		will-change: transform, opacity;
	}
</style>
