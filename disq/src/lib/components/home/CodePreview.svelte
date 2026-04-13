<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gsap } from 'gsap';
	import { ScrollTrigger } from 'gsap/ScrollTrigger';
	import { Copy, Check, MessageSquare, Send } from '@lucide/svelte';

	gsap.registerPlugin(ScrollTrigger);

	let copied = $state(false);
	let activeChannel = $state('# engineering');

	const codeSnippet = `async function deployToProduction() {
  const config = await loadConfig();

  if (!config.apiKey) {
    throw new Error('Missing API key');
  }

  const result = await deploy({
    environment: 'production',
    version: config.version,
    replicas: 3
  });

  return result.status;
}`;

	const channels = ['# general', '# engineering', '# deployments', '# code-review'];
	const voiceChannels = ['Standup Room', 'Pair Programming'];

	let sectionEl: HTMLElement;
	let card: HTMLDivElement;
	let sidebar: HTMLDivElement;
	let messages: HTMLDivElement;
	let codeBlock: HTMLDivElement;
	let title: HTMLDivElement;
	let ctx: gsap.Context;

	function handleCopy() {
		navigator.clipboard.writeText(codeSnippet);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	onMount(() => {
		ctx = gsap.context(() => {
			gsap.fromTo(
				title,
				{ opacity: 0, y: 60, skewY: 3 },
				{
					opacity: 1,
					y: 0,
					skewY: 0,
					duration: 1,
					ease: 'power4.out',
					scrollTrigger: {
						trigger: sectionEl,
						start: 'top 85%',
						toggleActions: 'play none none reverse'
					}
				}
			);

			const cardTl = gsap.timeline({
				scrollTrigger: { trigger: sectionEl, start: 'top 70%', end: 'top 20%', scrub: 1 }
			});
			cardTl.fromTo(
				card,
				{ opacity: 0, y: 150, scale: 0.85, rotateX: 15, transformPerspective: 1200 },
				{ opacity: 1, y: 0, scale: 1, rotateX: 0 }
			);

			gsap.fromTo(
				sidebar,
				{ opacity: 0, x: -50 },
				{
					opacity: 1,
					x: 0,
					duration: 0.8,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: sectionEl,
						start: 'top 50%',
						toggleActions: 'play none none reverse'
					}
				}
			);

			if (messages) {
				gsap.fromTo(
					Array.from(messages.children),
					{ opacity: 0, y: 30, x: -20, scale: 0.95 },
					{
						opacity: 1,
						y: 0,
						x: 0,
						scale: 1,
						duration: 0.6,
						stagger: 0.15,
						ease: 'back.out(1.5)',
						scrollTrigger: {
							trigger: sectionEl,
							start: 'top 40%',
							toggleActions: 'play none none reverse'
						}
					}
				);
			}

			gsap.fromTo(
				codeBlock,
				{ opacity: 0, scale: 0.95, boxShadow: '0 0 0 0 rgba(94, 234, 212, 0)' },
				{
					opacity: 1,
					scale: 1,
					boxShadow: '0 0 60px 0 rgba(94, 234, 212, 0.15)',
					duration: 1,
					ease: 'power3.out',
					scrollTrigger: {
						trigger: codeBlock,
						start: 'top 60%',
						toggleActions: 'play none none reverse'
					}
				}
			);

			gsap.to(card, {
				y: -80,
				ease: 'none',
				scrollTrigger: { trigger: sectionEl, start: 'top bottom', end: 'bottom top', scrub: 1 }
			});
		}, sectionEl);
	});

	onDestroy(() => ctx?.revert());
</script>

<section bind:this={sectionEl} class="relative py-32">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div bind:this={title} class="mb-16 text-center">
			<h2 class="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
				Chat meets <span class="text-accent">code</span>
			</h2>
			<p class="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
				Share snippets with syntax highlighting right in your conversations
			</p>
		</div>

		<div
			bind:this={card}
			class="relative mx-auto max-w-5xl"
			style="perspective: 1200px; transform-style: preserve-3d"
		>
			<div
				class="rounded-2xl border border-border bg-card p-1.5 shadow-2xl shadow-accent/5 transition-shadow duration-500 hover:shadow-accent/10"
			>
				<div class="flex min-h-137.5 overflow-hidden rounded-xl">
					<!-- Sidebar -->
					<div
						bind:this={sidebar}
						class="hidden w-60 shrink-0 border-r border-border bg-secondary/30 p-4 md:block"
					>
						<div class="mb-8">
							<h3 class="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
								Channels
							</h3>
							<div class="space-y-1">
								{#each channels as channel (channel)}
									<div
										onclick={() => (activeChannel = channel)}
										role="button"
										tabindex="0"
										onkeydown={(e) => e.key === 'Enter' && (activeChannel = channel)}
										class="cursor-pointer rounded-lg px-3 py-2.5 text-sm transition-all duration-300 {channel ===
										activeChannel
											? 'bg-accent/20 font-medium text-accent'
											: 'text-muted-foreground hover:translate-x-1 hover:bg-secondary hover:text-foreground'}"
									>
										{channel}
									</div>
								{/each}
							</div>
						</div>

						<div>
							<h3 class="mb-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
								Voice Channels
							</h3>
							<div class="space-y-1">
								{#each voiceChannels as channel (channel)}
									<div
										class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-all duration-300 hover:translate-x-1 hover:bg-secondary hover:text-foreground"
									>
										<span class="h-2 w-2 animate-pulse rounded-full bg-accent"></span>
										{channel}
									</div>
								{/each}
							</div>
						</div>
					</div>

					<!-- Main Chat -->
					<div class="flex flex-1 flex-col">
						<div class="flex items-center justify-between border-b border-border px-5 py-4">
							<div class="flex items-center gap-3">
								<span class="text-xl font-semibold text-foreground">{activeChannel}</span>
								<span class="hidden text-sm text-muted-foreground sm:inline">Team discussions</span>
							</div>
						</div>

						<!-- Messages -->
						<div bind:this={messages} class="flex-1 space-y-5 overflow-y-auto p-5">
							<!-- Message 1 -->
							<div class="group flex gap-4">
								<div
									class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/20 transition-transform duration-300 group-hover:scale-110"
								>
									<span class="text-sm font-semibold text-accent">SK</span>
								</div>
								<div class="flex-1">
									<div class="flex items-baseline gap-2">
										<span class="font-semibold text-foreground">Sarah Kim</span>
										<span class="text-xs text-muted-foreground">10:42 AM</span>
									</div>
									<p class="mt-1.5 text-muted-foreground">
										Just pushed the deployment script. Can someone review?
									</p>
								</div>
							</div>

							<!-- Code Snippet Message -->
							<div class="group flex gap-4">
								<div
									class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/20 transition-transform duration-300 group-hover:scale-110"
								>
									<span class="text-sm font-semibold text-blue-400">MJ</span>
								</div>
								<div class="flex-1">
									<div class="flex items-baseline gap-2">
										<span class="font-semibold text-foreground">Marcus Johnson</span>
										<span class="text-xs text-muted-foreground">10:45 AM</span>
									</div>
									<p class="mt-1.5 text-muted-foreground">Here's my implementation:</p>

									<!-- Code Block -->
									<div
										bind:this={codeBlock}
										class="mt-4 overflow-hidden rounded-xl border border-border bg-background transition-all duration-500 hover:border-accent/40"
									>
										<div
											class="flex items-center justify-between border-b border-border px-4 py-2.5"
										>
											<div class="flex items-center gap-3">
												<span class="text-sm font-medium text-accent">deploy.ts</span>
												<span
													class="rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase"
													>TypeScript</span
												>
											</div>
											<button
												onclick={handleCopy}
												class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-all duration-300 hover:scale-105 hover:bg-secondary hover:text-foreground"
											>
												{#if copied}
													<Check class="h-3.5 w-3.5 text-accent" />
													<span class="font-medium text-accent">Copied</span>
												{:else}
													<Copy class="h-3.5 w-3.5" />
													Copy
												{/if}
											</button>
										</div>
										<pre class="overflow-x-auto p-5 text-sm leading-relaxed"><code class="font-mono"
												><span class="text-blue-400">async function</span> <span class="text-accent"
													>deployToProduction</span
												><span class="text-foreground">() {'{'}</span>
  <span class="text-blue-400">const</span> <span class="text-foreground">config</span> <span
													class="text-foreground">=</span
												> <span class="text-blue-400">await</span> <span class="text-accent"
													>loadConfig</span
												><span class="text-foreground">();</span>

  <span class="text-blue-400">if</span> <span class="text-foreground">(!config.apiKey) {'{'}</span>
    <span class="text-blue-400">throw new</span> <span class="text-orange-400">Error</span><span
													class="text-foreground">(</span
												><span class="text-green-400">'Missing API key'</span><span
													class="text-foreground">);</span
												>
  <span class="text-foreground">}</span>

  <span class="text-blue-400">const</span> <span class="text-foreground">result</span> <span
													class="text-foreground">=</span
												> <span class="text-blue-400">await</span> <span class="text-accent"
													>deploy</span
												><span class="text-foreground">({'{'}</span>
    <span class="text-foreground">environment:</span> <span class="text-green-400"
													>'production'</span
												>
  <span class="text-foreground">});</span>

  <span class="text-blue-400">return</span> <span class="text-foreground">result.status;</span>
<span class="text-foreground">}</span></code
											></pre>
									</div>
								</div>
							</div>

							<!-- Reply -->
							<div class="group flex gap-4">
								<div
									class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/20 transition-transform duration-300 group-hover:scale-110"
								>
									<span class="text-sm font-semibold text-accent">SK</span>
								</div>
								<div class="flex-1">
									<div class="flex items-baseline gap-2">
										<span class="font-semibold text-foreground">Sarah Kim</span>
										<span class="text-xs text-muted-foreground">10:47 AM</span>
									</div>
									<p class="mt-1.5 text-muted-foreground">Looks clean! Approved and merging now.</p>
								</div>
							</div>
						</div>

						<!-- Message Input -->
						<div class="border-t border-border p-4">
							<div
								class="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-4 py-3.5 transition-all duration-300 focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10 hover:border-accent/30"
							>
								<MessageSquare class="h-5 w-5 text-muted-foreground" />
								<span class="flex-1 text-sm text-muted-foreground">Message {activeChannel}</span>
								<Send
									class="h-5 w-5 cursor-pointer text-muted-foreground transition-colors hover:text-accent"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
