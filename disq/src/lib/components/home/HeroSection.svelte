<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { ArrowRight, ChevronDown } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';

	gsap.registerPlugin(ScrollTrigger);

	const headingText = 'Where developers';
	const accentText = 'share code';

	let container: HTMLElement;
	let badge: HTMLDivElement;
	let headingLine: HTMLDivElement;
	let accentLine: HTMLDivElement;
	let desc: HTMLParagraphElement;
	let cta: HTMLDivElement;
	let note: HTMLParagraphElement;
	let scrollIndicator: HTMLDivElement;
	let ctx: gsap.Context;

	let charsEl: HTMLSpanElement[] = [];
	let accentCharsEl: HTMLSpanElement[] = [];

	function playGlitchAnimation() {
		if (!accentCharsEl.length) return;
		const tl = gsap.timeline();
		accentCharsEl.forEach((char, i) => {
			tl.to(
				char,
				{
					keyframes: [
						{
							x: gsap.utils.random(-4, 4),
							y: gsap.utils.random(-2, 2),
							skewX: gsap.utils.random(-10, 10),
							textShadow: '-3px 0 #00ffd5, 3px 0 #ff00ff',
							duration: 0.05
						},
						{
							x: gsap.utils.random(-3, 3),
							y: gsap.utils.random(-1, 1),
							skewX: gsap.utils.random(-5, 5),
							textShadow: '3px 0 #00ffd5, -3px 0 #ff00ff',
							duration: 0.05
						},
						{
							x: gsap.utils.random(-2, 2),
							y: 0,
							skewX: gsap.utils.random(-3, 3),
							textShadow: '-2px 0 #00ffd5, 2px 0 #ff00ff',
							duration: 0.05
						},
						{ x: 0, y: 0, skewX: 0, textShadow: 'none', duration: 0.15 }
					],
					ease: 'power2.inOut'
				},
				i * 0.02
			);
		});
	}

	onMount(() => {
		ctx = gsap.context(() => {
			const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

			tl.fromTo(
				badge,
				{ opacity: 0, y: 50, scale: 0.5, rotateX: 90 },
				{ opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 1, ease: 'elastic.out(1, 0.5)' }
			)
				.fromTo(
					charsEl,
					{ opacity: 0, y: 80, rotateX: -90, scale: 0.5 },
					{
						opacity: 1,
						y: 0,
						rotateX: 0,
						scale: 1,
						duration: 0.8,
						stagger: { amount: 0.5, from: 'start' },
						ease: 'back.out(1.7)'
					},
					'-=0.5'
				)
				.fromTo(
					accentCharsEl,
					{
						opacity: 0,
						y: 60,
						x: () => gsap.utils.random(-30, 30),
						scale: 0,
						rotateZ: () => gsap.utils.random(-20, 20)
					},
					{
						opacity: 1,
						y: 0,
						x: 0,
						scale: 1,
						rotateZ: 0,
						duration: 0.6,
						stagger: { amount: 0.4, from: 'random' },
						ease: 'back.out(2)'
					},
					'-=0.4'
				)
				.add(() => playGlitchAnimation(), '-=0.1')
				.fromTo(
					desc,
					{ opacity: 0, y: 40, filter: 'blur(10px)' },
					{ opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8 },
					'-=0.3'
				)
				.fromTo(
					Array.from(cta?.children ?? []),
					{ opacity: 0, y: 30, scale: 0.8 },
					{
						opacity: 1,
						y: 0,
						scale: 1,
						duration: 0.6,
						stagger: 0.15,
						ease: 'back.out(1.7)'
					},
					'-=0.3'
				)
				.fromTo(note, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
				.fromTo(
					scrollIndicator,
					{ opacity: 0, y: -20 },
					{ opacity: 1, y: 0, duration: 0.6 },
					'-=0.1'
				);

			// Scroll indicator bounce
			const chevron = scrollIndicator?.querySelector('.chevron');
			if (chevron) {
				gsap.to(chevron, {
					y: 8,
					duration: 1.2,
					repeat: -1,
					yoyo: true,
					ease: 'sine.inOut'
				});
			}

			// Parallax on scroll
			ScrollTrigger.create({
				trigger: container,
				start: 'top top',
				end: 'bottom top',
				scrub: 1,
				onUpdate: (self) => {
					const progress = self.progress;
					gsap.set(container, { y: progress * 200 });
					gsap.set([headingLine, accentLine, desc, cta], {
						opacity: 1 - progress * 1.8,
						filter: `blur(${progress * 12}px)`
					});
				}
			});
		}, container);
	});

	onDestroy(() => {
		ctx?.revert();
	});

	function scrollDown() {
		window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
	}
</script>

<section
	bind:this={container}
	class="relative flex min-h-screen items-center overflow-hidden pt-24 pb-20 sm:pt-32 sm:pb-32"
>
	<div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-4xl text-center">
			<!-- Main Heading -->
			<div
				bind:this={headingLine}
				class="text-5xl leading-[0.9] font-bold tracking-tight text-foreground sm:text-7xl lg:text-8xl"
				style="perspective: 1000px"
			>
				{#each headingText.split('') as char, i (i)}
					<span
						bind:this={charsEl[i]}
						class="inline-block"
						style={char === ' ' ? 'display: inline; min-width: 0.3em' : 'display: inline-block'}
					>
						{char === ' ' ? '\u00A0' : char}
					</span>
				{/each}
			</div>

			<div
				bind:this={accentLine}
				class="mt-2 block cursor-pointer text-5xl leading-[0.9] font-bold tracking-tight sm:text-7xl lg:text-8xl"
				onmouseenter={playGlitchAnimation}
				role="presentation"
				style="perspective: 1000px"
			>
				<span
					class="inline-flex items-center rounded-lg px-4 py-1"
					style="color: oklch(0.72 0.2 160);"
				>
					{#each accentText.split('') as char, i (i)}
						<span
							bind:this={accentCharsEl[i]}
							class="inline-block transition-colors duration-100"
							style={char === ' ' ? 'display: inline; min-width: 0.3em' : 'display: inline-block'}
						>
							{char === ' ' ? '\u00A0' : char}
						</span>
					{/each}
				</span>
			</div>

			<p
				bind:this={desc}
				class="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl lg:text-2xl"
			>
				Real-time messaging meets beautiful code snippets. Built for teams who collaborate, debug,
				and ship together.
			</p>

			<div
				bind:this={cta}
				class="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
			>
				<button
					onclick={() => goto(resolve('/servers/@me'))}
					class="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-md bg-primary px-8 text-base font-medium text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90 hover:shadow-lg sm:w-auto"
					style="box-shadow: 0 0 0 0 oklch(0.72 0.2 160 / 0);"
					onmouseenter={(e) => {
						(e.currentTarget as HTMLElement).style.boxShadow =
							'0 10px 30px -5px oklch(0.72 0.2 160 / 0.3)';
					}}
					onmouseleave={(e) => {
						(e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 0 oklch(0.72 0.2 160 / 0)';
					}}
				>
					Start now
					<ArrowRight class="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
				</button>
			</div>

			<p bind:this={note} class="mt-4 text-sm text-muted-foreground opacity-0">
			</p>
		</div>
	</div>

	<!-- Scroll indicator -->
	<div
		bind:this={scrollIndicator}
		class="absolute bottom-8 left-1/2 flex -translate-x-1/2 cursor-pointer flex-col items-center gap-2 transition-opacity hover:opacity-70"
		onclick={scrollDown}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && scrollDown()}
	>
		<span class="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">Explore</span
		>
		<ChevronDown class="chevron h-5 w-5 text-muted-foreground" />
	</div>
</section>
