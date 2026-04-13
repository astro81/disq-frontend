<script lang="ts">
    import { page } from "$app/state";
    import type { Route } from "./$types";

    import { cn } from "$lib/utils";

    import { resolve } from "$app/paths";

    import ActionTooltip from "$lib/components/navigation/ActionTooltip.svelte";

    interface NavigationItemProps {
        serverId: string;
        serverName: string;
        serverImageUrl: string;
    }

    let { serverId, serverName, serverImageUrl }: NavigationItemProps = $props();

    let serverHref = $derived(`/servers/${serverId}` as Route);

    let isActive = $derived(page.params.serverId === serverId)

</script>

<ActionTooltip side="right" align="center" label={serverName}>
    <a
            href={resolve(serverHref)}
            class="group relative flex items-center">
        <!-- server indicator -->
        <div class={cn(
                "absolute left-0 bg-primary rounded-r-full transition-all w-1",
                !isActive && "group-hover:h-5",
                isActive ? "h-9" : "h-2"
            )}>
        </div>

        <!-- server image -->
        <div class={cn(
            "relative group flex mx-3 size-12 rounded-[24px] group-hover:rounded-[16px] transition-all overflow-hidden",
            isActive && "bg-primary/10 text-primary rounded-[16px]"
            )}>
            <img src={serverImageUrl} alt={serverName} class="size-full object-cover"/>
        </div>
    </a>
</ActionTooltip>