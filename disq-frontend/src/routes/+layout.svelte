<script lang="ts">
	import './layout.css';
    import favicon from '$lib/assets/favicon.svg';
    import type {Snippet} from "svelte";
    import type {LayoutData} from "./$types";
    import {setUserState} from "$lib/stores/user-state.svelte";

    let { data, children }: { data: LayoutData; children: Snippet } = $props()

    let userState = setUserState();
    userState.user = data.user ?? null;

    $effect(() => {
        if (data.user) {
            userState.add(data.user);
        } else {
            userState.remove();
        }
    })
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
