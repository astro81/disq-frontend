<script lang="ts">
    import type { LayoutProps } from './$types';

    let { children }: LayoutProps = $props();
</script>

<div class="h-screen bg-card">
    {@render children()}
</div>