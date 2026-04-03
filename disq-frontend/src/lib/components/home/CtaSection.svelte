<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { ArrowRight } from '@lucide/svelte';

	gsap.registerPlugin(ScrollTrigger);

	let sectionEl: HTMLElement;
	let containerEl: HTMLDivElement;
	let titleEl: HTMLHeadingElement;
	let descEl: HTMLParagraphElement;
	let ctaEl: HTMLDivElement;
	let noteEl: HTMLParagraphElement;
	let glowEl: HTMLDivElement;
	let ctx: gsap.Context;

	onMount(() => {
		ctx = gsap.context(() => {
			// Container scale reveal
			gsap.fromTo(
				containerEl,
				{ opacity: 0, scale: 0.9, y: 80 },
				{
					opacity: 1,
					scale: 1,
					y: 0,
					duration: 1.2,
					ease: 'power4.out',
					scrollTrigger: {
						trigger: sectionEl,
						start: 'top 75%',
						toggleActions: 'play none none reverse'
					}
				}
			);

			// Title kinetic reveal
			gsap.fromTo(
				titleEl,
				{ opacity: 0, y: 60, skewY: 5 },
				{
					opacity: 1,
					y: 0,
					skewY: 0,
					duration: 0.9,
					delay: 0.2,
					ease: 'power4.out',
					scrollTrigger: {
						trigger: sectionEl,
						start: 'top 70%',
						toggleActions: 'play none none reverse'
					}
				}
			);

			// Description fade
			gsap.fromTo(
				descEl,
				{ opacity: 0, y: 30 },
				{
					opacity: 1,
					y: 0,
					duration: 0.7,
					delay: 0.4,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: sectionEl,
						start: 'top 70%',
						toggleActions: 'play none none reverse'
					}
				}
			);

			// CTA buttons bounce
			gsap.fromTo(
				Array.from(ctaEl?.children ?? []),
				{ opacity: 0, y: 25, scale: 0.9 },
				{
					opacity: 1,
					y: 0,
					scale: 1,
					duration: 0.6,
					delay: 0.5,
					stagger: 0.12,
					ease: 'back.out(1.7)',
					scrollTrigger: {
						trigger: sectionEl,
						start: 'top 70%',
						toggleActions: 'play none none reverse'
					}
				}
			);

			// Note text
			gsap.fromTo(
				noteEl,
				{ opacity: 0, y: 15 },
				{
					opacity: 1,
					y: 0,
					duration: 0.5,
					delay: 0.7,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: sectionEl,
						start: 'top 70%',
						toggleActions: 'play none none reverse'
					}
				}
			);

			// Glow pulse
			gsap.to(glowEl, {
				scale: 1.3,
				opacity: 0.5,
				duration: 4,
				repeat: -1,
				yoyo: true,
				ease: 'sine.inOut'
			});

			// Parallax
			gsap.to(containerEl, {
				y: -50,
				ease: 'none',
				scrollTrigger: { trigger: sectionEl, start: 'top bottom', end: 'bottom top', scrub: 1 }
			});
		}, sectionEl);
	});

	onDestroy(() => ctx?.revert());
</script>

<section bind:this={sectionEl} class="relative overflow-hidden py-32 pb-40">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div
			bind:this={containerEl}
			class="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-card/50 px-8 py-20 text-center backdrop-blur-sm sm:px-16"
		>
			<!-- Background glow -->
			<div
				bind:this={glowEl}
				class="absolute top-1/2 left-1/2 h-112.5 w-162.5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-35"
				style="background: radial-gradient(circle, oklch(0.7 0.15 160 / 0.35) 0%, transparent 70%); filter: blur(70px);"
			></div>

			<h2
				bind:this={titleEl}
				class="relative text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
			>
				Ready to start
				<span class="text-accent"> coding together</span>?
			</h2>

			<p
				bind:this={descEl}
				class="relative mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:text-xl"
			>
				Join thousands of developers who communicate better. Your team's new favorite place to share
				code is waiting.
			</p>

			<div
				bind:this={ctaEl}
				class="relative mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
			>
				<button
					class="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-md bg-primary px-8 text-base font-medium text-primary-foreground transition-all duration-300 hover:scale-105 hover:bg-primary/90 hover:shadow-lg hover:shadow-accent/20 sm:w-auto"
				>
					Get started free
					<ArrowRight class="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
				</button>
				<button
					class="inline-flex h-14 w-full items-center justify-center gap-2 rounded-md px-8 text-base font-medium transition-all duration-300 hover:scale-105 hover:bg-accent hover:text-accent-foreground sm:w-auto"
				>
					Talk to sales
				</button>
			</div>

			<p bind:this={noteEl} class="relative mt-8 text-sm text-muted-foreground">
				Free forever for small teams. No credit card required.
			</p>
		</div>
	</div>
</section>
