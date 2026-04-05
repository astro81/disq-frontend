<script lang="ts">
    import { enhance } from '$app/forms';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '$lib/components/ui/dialog';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
    import { Separator } from '$lib/components/ui/separator';
    import { Camera, X, Loader2, ImagePlus } from '@lucide/svelte';

    type UserType = {
        name: string;
        email: string;
        emailVerified: boolean;
        image: string | null;
        createdAt: string;
        updatedAt: string;
        displayName: string;
        profileBannerImage: string | null;
        id: string;
    };

    let { open = $bindable(false), user }: { open: boolean; user: UserType } = $props();

    let displayName = $derived(user.displayName);
    let newUsername = $derived(user.name);
    let avatarPreview = $derived<string | null>(user.image);
    let bannerPreview = $derived<string | null>(user.profileBannerImage);
    let avatarFile = $state<File | null>(null);
    let bannerFile = $state<File | null>(null);
    let removeAvatar = $state(false);
    let removeBanner = $state(false);
    let avatarInput: HTMLInputElement;
    let bannerInput: HTMLInputElement;
    let loading = $state(false);
    let error = $state<string | null>(null);

    const initials = $derived(
        displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    );

    $effect(() => {
        if (open) {
            displayName = user.displayName;
            newUsername = user.name;
            avatarPreview = user.image;
            bannerPreview = user.profileBannerImage;
            avatarFile = null;
            bannerFile = null;
            removeAvatar = false;
            removeBanner = false;
            error = null;
        }
    });

    function onAvatarChange(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        avatarFile = file;
        removeAvatar = false;
        avatarPreview = URL.createObjectURL(file);
    }

    function onBannerChange(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        bannerFile = file;
        removeBanner = false;
        bannerPreview = URL.createObjectURL(file);
    }

    function clearAvatar() {
        avatarFile = null;
        avatarPreview = null;
        removeAvatar = true;
        avatarInput.value = '';
    }

    function clearBanner() {
        bannerFile = null;
        bannerPreview = null;
        removeBanner = true;
        bannerInput.value = '';
    }
</script>

<Dialog bind:open>
    <DialogContent class="sm:max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader class="px-6 pt-6 pb-0">
            <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form
            method="POST"
            action="?/updateProfile"
            enctype="multipart/form-data"
            use:enhance={() => {
                loading = true;
                error = null;
                return async ({ result, update }) => {
                    loading = false;
                    if (result.type === 'failure') {
                        error = (result.data?.error as string) ?? 'Something went wrong';
                    } else {
                        open = false;
                        await update();
                    }
                };
            }}
            class="flex flex-col"
        >
            <input type="hidden" name="removeAvatar" value={removeAvatar} />
            <input type="hidden" name="removeBanner" value={removeBanner} />

            <!-- Banner -->
            <div
                class="relative h-32 bg-muted mt-4 group cursor-pointer overflow-hidden"
                onclick={() => bannerInput.click()}
                onkeydown={(e) => e.key === 'Enter' && bannerInput.click()}
                role="button"
                tabindex="0"
            >
                {#if bannerPreview}
                    <img src={bannerPreview} alt="banner" class="w-full h-full object-cover" />
                {/if}
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <ImagePlus class="w-5 h-5 text-white" />
                    <span class="text-white text-sm font-medium">Change Banner</span>
                </div>
                {#if bannerPreview}
                    <button
                        type="button"
                        onclick={(e) => { e.stopPropagation(); clearBanner(); }}
                        class="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full p-1 transition-colors"
                    >
                        <X class="w-3.5 h-3.5 text-white" />
                    </button>
                {/if}
                <input
                    bind:this={bannerInput}
                    type="file"
                    name="banner"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    class="hidden"
                    onchange={onBannerChange}
                />
            </div>

            <div class="px-6 pb-2 pt-0 space-y-4">
                <!-- Avatar -->
                <div class="-mt-8 flex items-end gap-3">
                    <div class="relative group">
                        <Avatar
                            class="w-16 h-16 ring-4 ring-background cursor-pointer"
                            onclick={() => avatarInput.click()}
                        >
                            <AvatarImage src={avatarPreview ?? ''} alt={displayName} />
                            <AvatarFallback class="text-lg font-semibold">{initials}</AvatarFallback>
                        </Avatar>
                        <button
                            type="button"
                            onclick={() => avatarInput.click()}
                            class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                            <Camera class="w-4 h-4 text-white" />
                        </button>
                        {#if avatarPreview}
                            <button
                                type="button"
                                onclick={clearAvatar}
                                class="absolute -top-1 -right-1 bg-destructive hover:bg-destructive/80 rounded-full p-0.5 transition-colors"
                            >
                                <X class="w-3 h-3 text-white" />
                            </button>
                        {/if}
                        <input
                            bind:this={avatarInput}
                            type="file"
                            name="avatar"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            class="hidden"
                            onchange={onAvatarChange}
                        />
                    </div>
                    <p class="text-xs text-muted-foreground pb-1">Click avatar or banner to change</p>
                </div>

                <Separator />

                <!-- Display Name -->
                <div class="space-y-1.5">
                    <Label for="displayName">Display Name</Label>
                    <Input
                        id="displayName"
                        name="displayName"
                        bind:value={displayName}
                        placeholder="Your display name"
                        required
                    />
                </div>

                <!-- Username -->
                <div class="space-y-1.5">
                    <Label for="username">Username</Label>
                    <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">@</span>
                        <Input
                            id="username"
                            name="username"
                            bind:value={newUsername}
                            placeholder="your_username"
                            class="pl-7"
                            required
                        />
                    </div>
                    <p class="text-xs text-muted-foreground">Letters, numbers, underscores, and dots only.</p>
                </div>

                {#if error}
                    <p class="text-sm text-destructive">{error}</p>
                {/if}
            </div>

            <DialogFooter class="px-6 py-4 gap-2">
                <Button type="button" variant="outline" onclick={() => (open = false)} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading} class="gap-2">
                    {#if loading}
                        <Loader2 class="w-4 h-4 animate-spin" />
                        Saving…
                    {:else}
                        Save Changes
                    {/if}
                </Button>
            </DialogFooter>
        </form>
    </DialogContent>
</Dialog>