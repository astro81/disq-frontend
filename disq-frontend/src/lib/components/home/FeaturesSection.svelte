<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { Code2, MessageSquare, Video, Zap, Shield, Users } from '@lucide/svelte';

	gsap.registerPlugin(ScrollTrigger);

	const features = [
		{
			icon: Code2,
			title: 'Syntax Highlighting',
			description: '50+ languages with beautiful, readable code right in your conversations.'
		},
		{
			icon: MessageSquare,
			title: 'Threaded Discussions',
			description: 'Keep code reviews organized with threads that maintain context over time.'
		},
		{
			icon: Video,
			title: 'Voice & Video',
			description: 'Jump into voice channels for pair programming or quick team standups.'
		},
		{
			icon: Zap,
			title: 'Real-time Sync',
			description: 'Messages and snippets appear instantly across all connected devices.'
		},
		{
			icon: Shield,
			title: 'Enterprise Security',
			description: 'SOC 2 compliant with end-to-end encryption. Your code stays private.'
		},
		{
			icon: Users,
			title: 'Team Workspaces',
			description: 'Organize by projects with channels, roles, and granular permissions.'
		}
	];

	let sectionEl: HTMLElement;
	let headingEl: HTMLDivElement;
	let cardEls: (HTMLDivElement | null)[] = [];
	let iconEls: (HTMLDivElement | null)[] = [];
	let ctx: gsap.Context;

	onMount(() => {
		ctx = gsap.context(() => {
			// Heading reveal
			const headingTl = gsap.timeline({
				scrollTrigger: {
					trigger: sectionEl,
					start: 'top 80%',
					toggleActions: 'play none none reverse'
				}
			});

			headingTl
				.fromTo(
					headingEl?.querySelector('h2'),
					{ opacity: 0, y: 80, skewY: 5 },
					{ opacity: 1, y: 0, skewY: 0, duration: 1, ease: 'power4.out' }
				)
				.fromTo(
					headingEl?.querySelector('p'),
					{ opacity: 0, y: 40 },
					{ opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
					'-=0.5'
				);

			// Cards 3D reveal
			cardEls.forEach((card, index) => {
				if (!card) return;
				const col = index % 3;
				const row = Math.floor(index / 3);
				const xOffset = (col - 1) * 30;

				gsap.fromTo(
					card,
					{
						opacity: 0,
						y: 100,
						x: xOffset,
						rotateY: (col - 1) * -15,
						rotateX: 20,
						scale: 0.8,
						transformPerspective: 1000
					},
					{
						opacity: 1,
						y: 0,
						x: 0,
						rotateY: 0,
						rotateX: 0,
						scale: 1,
						duration: 1,
						delay: row * 0.2 + col * 0.1,
						ease: 'power4.out',
						scrollTrigger: {
							trigger: sectionEl,
							start: 'top 60%',
							toggleActions: 'play none none reverse'
						}
					}
				);

				// Magnetic hover
				card.addEventListener('mousemove', (e) => {
					const rect = card.getBoundingClientRect();
					const x = e.clientX - rect.left - rect.width / 2;
					const y = e.clientY - rect.top - rect.height / 2;
					gsap.to(card, {
						rotateY: x * 0.05,
						rotateX: -y * 0.05,
						duration: 0.3,
						ease: 'power2.out'
					});
				});

				card.addEventListener('mouseleave', () => {
					gsap.to(card, {
						rotateY: 0,
						rotateX: 0,
						duration: 0.5,
						ease: 'elastic.out(1, 0.5)'
					});
				});

				card.addEventListener('mouseenter', () => {
					const icon = iconEls[index];
					if (icon) {
						gsap.to(icon, { scale: 1.2, rotate: 10, duration: 0.4, ease: 'back.out(2)' });
					}
				});

				card.addEventListener('mouseleave', () => {
					const icon = iconEls[index];
					if (icon) {
						gsap.to(icon, { scale: 1, rotate: 0, duration: 0.3, ease: 'power2.out' });
					}
				});
			});

			// Parallax heading
			gsap.to(headingEl, {
				y: -60,
				ease: 'none',
				scrollTrigger: {
					trigger: sectionEl,
					start: 'top bottom',
					end: 'bottom top',
					scrub: 1
				}
			});
		}, sectionEl);
	});

	onDestroy(() => ctx?.revert());
</script>

<section bind:this={sectionEl} id="features" class="relative overflow-hidden py-32">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div bind:this={headingEl} class="mx-auto mb-20 max-w-2xl text-center">
			<h2 class="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
				Built for how
				<span class="text-accent"> developers </span>
				work
			</h2>
			<p class="mt-6 text-lg text-muted-foreground lg:text-xl">
				Every feature designed with developer experience in mind. No fluff, just tools that matter.
			</p>
		</div>

		<div
			class="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3"
			style="perspective: 1000px"
		>
			{#each features as feature, index (index)}
				<div
					bind:this={cardEls[index]}
					class="group relative cursor-pointer rounded-2xl border border-border bg-card/50 p-8 backdrop-blur-sm transition-colors duration-300 hover:border-green-500/60 hover:bg-card"
					style="transform-style: preserve-3d"
				>
					<!-- Glow effect -->
					<div
						class="absolute inset-0 rounded-2xl bg-linear-to-br from-green-500/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
					></div>

					<div
						bind:this={iconEls[index]}
						class="relative mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent"
					>
						<svelte:component this={feature.icon} class="h-7 w-7" />
					</div>
					<h3 class="relative mb-3 text-xl font-semibold text-foreground">{feature.title}</h3>
					<p class="relative leading-relaxed text-muted-foreground">{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
