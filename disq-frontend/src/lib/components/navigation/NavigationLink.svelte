<script lang="ts">
    import type { Route } from './$types';

    import { page } from "$app/state";
    import { resolve } from "$app/paths";
    import type { Snippet } from "svelte";

    import { cn } from "$lib/utils";
    import ActionTooltip from "$lib/components/navigation/ActionTooltip.svelte";

    let { href, label, icon }: {
        href: Route,
        label: string,
        icon: Snippet
    } = $props();

    const resolvedHref = $derived(resolve(href));
    const isActive = $derived(page.url.pathname === resolvedHref);
</script>

<ActionTooltip side="right" align="center" {label}>
    <a
            href={resolve(href)}
            class="group relative flex items-center"
    >
        <div
                class={cn(
                "absolute left-0 bg-primary rounded-r-full transition-all w-1",
                !isActive && "group-hover:h-5",
                isActive ? "h-9" : "h-2"
            )}
        ></div>

        <div
                class={cn(
                "relative flex mx-3 size-12 rounded-[24px] transition-all overflow-hidden items-center justify-center",
                "group-hover:bg-indigo-500 group-hover:rounded-[16px]",
                isActive
                    ? "bg-primary/10 rounded-[16px]"
                    : "bg-background dark:bg-neutral-700"
            )}
        >
            <div class={cn(
                "transition",
                "group-hover:text-white",
                isActive && "text-primary"
            )}>
                {@render icon()}
            </div>
        </div>
    </a>
</ActionTooltip>