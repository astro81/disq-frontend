<script lang="ts">
    import { Hash } from '@lucide/svelte';

    import SocketIndicator from '$lib/components/socket/SocketIndicator.svelte';

    interface ChatHeaderProps {
        name: string;
        type: 'channel';
    }

    let { name, type }: ChatHeaderProps = $props();
</script>

<div
        class="text-md flex h-12 items-center border-b-2 border-neutral-200 px-3 font-semibold dark:border-neutral-800"
>

    {#if type === 'channel'}
        <Hash class="mr-2 size-5 text-zinc-500 dark:text-zinc-400" />
    {/if}

    <p class="text-md font-semibold">{name}</p>

    <div class="ml-auto flex items-center">
        <SocketIndicator />
    </div>
</div>
