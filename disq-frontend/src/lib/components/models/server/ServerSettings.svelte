<script lang="ts">
    import { Camera, Trash2, CircleAlert, Lock } from '@lucide/svelte'

    import {UPLOAD_CONSTRAINTS} from "$lib/constants/upload";

    import {
        Field, FieldContent,
        FieldDescription,
        FieldError,
        FieldGroup,
        FieldLabel,
    } from "$lib/components/ui/field";

    import {Switch} from "$lib/components/ui/switch";

    import { Button } from '$lib/components/ui/button/index.js'
    import { Input } from '$lib/components/ui/input/index.js'

    import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "$lib/components/ui/dialog";

    import { updateServer} from "$lib/remote/server/server-settings.remote";

    let { isServerEditDialogOpen = $bindable(), currentServer } = $props();


    let loading = $state(false)
    let isPrivateServer = $state(false)

    const serverImageConstraints = UPLOAD_CONSTRAINTS.serverImage
    const acceptImage = serverImageConstraints.allowedTypes.join(',')

    const serverBannerConstraints = UPLOAD_CONSTRAINTS.serverBanner
    const acceptBanner = serverBannerConstraints.allowedTypes.join(',')

    let serverImageFile = $state<File | null>(null)
    let serverImagePreview = $derived<string | null>(currentServer.serverImageUrl)
    const serverImageIssues = $derived(updateServer.fields.serverImage?.issues() ?? [])

    let bannerImageFile = $state<File | null>(null)
    let bannerImagePreview = $derived<string | null>(currentServer.serverBannerImageUrl)
    const bannerImageIssues = $derived(updateServer.fields.serverBannerImage?.issues() ?? [])

    function onServerImageChange(e: Event) {
        const input = e.target as HTMLInputElement
        const file = input.files?.[0] ?? null
        input.value = ''

        if (!file) return

        if (serverImagePreview) URL.revokeObjectURL(serverImagePreview)
        serverImageFile = file
        serverImagePreview = URL.createObjectURL(file)

        const hiddenInput = document.querySelector<HTMLInputElement>('input[name="serverImage"]')
        if (hiddenInput) {
            const dt = new DataTransfer()
            dt.items.add(file)
            hiddenInput.files = dt.files
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }))
        }
    }

    function onBannerImageChange(e: Event) {
        const input = e.target as HTMLInputElement
        const file = input.files?.[0] ?? null
        input.value = ''

        if (!file) return

        if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview)
        bannerImageFile = file
        bannerImagePreview = URL.createObjectURL(file)

        const hiddenInput = document.querySelector<HTMLInputElement>('input[name="serverBannerImage"]')
        if (hiddenInput) {
            const dt = new DataTransfer()
            dt.items.add(file)
            hiddenInput.files = dt.files
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }))
        }
    }

    function removeServerImage() {
        if (serverImagePreview) URL.revokeObjectURL(serverImagePreview)
        serverImageFile = null
        serverImagePreview = null

        const hiddenInput = document.querySelector<HTMLInputElement>('input[name="serverImage"]')
        if (hiddenInput) {
            hiddenInput.value = ''
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }))
        }
    }

    function removeBannerImage() {
        if (bannerImagePreview) URL.revokeObjectURL(bannerImagePreview)
        bannerImageFile = null
        bannerImagePreview = null

        const hiddenInput = document.querySelector<HTMLInputElement>('input[name="serverBannerImage"]')
        if (hiddenInput) {
            hiddenInput.value = ''
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }))
        }
    }
</script>

<Dialog bind:open={isServerEditDialogOpen}>
    <DialogContent class="sm:max-w-md">
        <DialogHeader>
            <DialogTitle>Server Settings</DialogTitle>
            <DialogDescription>Update your server's name, description and images.</DialogDescription>
        </DialogHeader>

        <form {...updateServer.enhance(async ({ submit, form }) => {
            await submit();
            form.reset();
            isServerEditDialogOpen = false;
        })}
              oninput={() => updateServer.validate()}
              enctype="multipart/form-data"
              class="flex flex-col gap-5">

            <!-- Global-level errors -->
            {#if (updateServer.fields.allIssues()?.some(issue => !issue.path || issue.path.length === 0))}
                <div class="mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-3 flex items-start gap-2">
                    <CircleAlert class="w-5 h-5 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
                    <div class="flex flex-col gap-1 text-sm">
                        {#each (updateServer.fields.allIssues()?.filter(issue => !issue.path || issue.path.length === 0)) ?? [] as issue (issue)}
                            <p>{issue.message}</p>
                        {/each}
                    </div>
                </div>
            {/if}

            <div>
                <FieldGroup class="gap-2">

                    <input {...updateServer.fields.serverId.as('text')} value={currentServer.serverId} class="hidden"/>

                    <!-- Server Name -->
                    <Field data-invalid={(updateServer.fields.serverName?.issues() ?? []).length > 0}>
                        <FieldLabel for="serverName">Server Name</FieldLabel>
                        <Input {...updateServer.fields.serverName.as('text')} placeholder="Enter a unique server name"/>
                        <FieldError>
                            {#each updateServer.fields.serverName.issues() ?? [] as issue (issue)}
                                <p>{issue.message}</p>
                            {/each}
                        </FieldError>
                    </Field>

                    <!-- Server Description -->
                    <Field data-invalid={(updateServer.fields.serverDescription?.issues() ?? []).length > 0}>
                        <FieldLabel for="serverDescription">Server Name</FieldLabel>
                        <Input {...updateServer.fields.serverDescription.as('text')} placeholder="What's this server about?"/>
                        <FieldError>
                            {#each updateServer.fields.serverDescription.issues() ?? [] as issue (issue)}
                                <p>{issue.message}</p>
                            {/each}
                        </FieldError>
                    </Field>

                    <!-- Server Privacy -->
                    <Field
                            data-invalid={(updateServer.fields.isPrivateServer?.issues() ?? []).length > 0}
                            class="rounded-lg border border-border bg-muted/40 p-4 transition-colors hover:bg-muted/70"
                    >
                        <input
                                {...updateServer.fields.isPrivateServer.as('checkbox')}
                                class="hidden"
                                value={isPrivateServer}
                        />

                        <div class="flex items-center justify-between w-full">
                            <div class="flex items-center gap-3">
                                <div class="flex size-8 items-center justify-center rounded-full bg-background">
                                    <Lock class="size-4 text-muted-foreground" />
                                </div>
                                <FieldContent>
                                    <FieldLabel for="isPrivateServer" class="text-sm font-medium cursor-pointer">
                                        Private Server
                                    </FieldLabel>
                                    <FieldDescription class="text-xs text-muted-foreground">
                                        Only invited members can join
                                    </FieldDescription>
                                </FieldContent>
                            </div>

                            <Switch
                                    id="isPrivateServer"
                                    bind:checked={isPrivateServer}
                                    aria-label="Toggle private server"
                            />
                        </div>

                        <FieldError>
                            {#each updateServer.fields.isPrivateServer.issues() ?? [] as issue (issue)}
                                <p>{issue.message}</p>
                            {/each}
                        </FieldError>
                    </Field>

                    <!-- Server Image -->
                    <Field data-invalid={serverImageIssues.length > 0}>
                        <FieldLabel>Server Image</FieldLabel>

                        <!-- Hidden input owned by the remote field - drives FormData on submit -->
                        <input
                                {...updateServer.fields.serverImage.as('file')}
                                accept={acceptImage}
                                class="sr-only"
                                tabindex="-1"
                                aria-hidden="true"
                        />

                        {#if serverImagePreview}
                            <div class="relative w-20 h-20 rounded-full overflow-hidden bg-muted">
                                <img src={serverImagePreview} alt="Server preview" class="w-full h-full object-cover" />
                                <button
                                        type="button"
                                        onclick={removeServerImage}
                                        class="absolute inset-0 flex items-center justify-center
                                       bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-full"
                                        aria-label="Remove image"
                                >
                                    <Trash2 class="size-4 text-white" />
                                </button>
                            </div>
                        {:else}
                            <label
                                    class="flex flex-col items-center justify-center gap-2 rounded-xl border-2
                                   border-dashed bg-muted/40 py-6 cursor-pointer hover:bg-muted/70
                                   transition-colors {serverImageIssues.length > 0 ? 'border-destructive' : 'border-border'}"
                            >
                                <Camera class="size-6 text-muted-foreground" />
                                <span class="text-xs text-muted-foreground">
                                {serverImageConstraints.allowedLabel} · Max {serverImageConstraints.maxLabel}
                            </span>
                                <!-- Visible picker input - syncs file into hidden remote input via DataTransfer -->
                                <input
                                        type="file"
                                        accept={acceptImage}
                                        class="sr-only"
                                        onchange={onServerImageChange}
                                />
                            </label>
                        {/if}

                        {#if serverImageIssues.length > 0}
                            <FieldError>
                                {#each serverImageIssues as issue (issue.message)}
                                    <p>{issue.message}</p>
                                {/each}
                            </FieldError>
                        {/if}
                    </Field>

                    <!-- Server Banner Image -->
                    <Field data-invalid={bannerImageIssues.length > 0}>
                        <FieldLabel>Server Image</FieldLabel>

                        <!-- Hidden input owned by the remote field - drives FormData on submit -->
                        <input
                                {...updateServer.fields.serverBannerImage.as('file')}
                                accept={acceptBanner}
                                class="sr-only"
                                tabindex="-1"
                                aria-hidden="true"
                        />

                        {#if bannerImagePreview}
                            <div class="relative w-20 h-20 rounded-full overflow-hidden bg-muted">
                                <img src={bannerImagePreview} alt="Server preview" class="w-full h-full object-cover"/>
                                <button
                                        type="button"
                                        onclick={removeBannerImage}
                                        class="absolute inset-0 flex items-center justify-center
                                                           bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-full"
                                        aria-label="Remove image"
                                >
                                    <Trash2 class="size-4 text-white"/>
                                </button>
                            </div>
                        {:else}
                            <label
                                    class="flex flex-col items-center justify-center gap-2 rounded-xl border-2
                                                       border-dashed bg-muted/40 py-6 cursor-pointer hover:bg-muted/70
                                                       transition-colors {bannerImageIssues.length > 0 ? 'border-destructive' : 'border-border'}"
                            >
                                <Camera class="size-6 text-muted-foreground"/>
                                <span class="text-xs text-muted-foreground">
                                                    {serverBannerConstraints.allowedLabel} · Max {serverBannerConstraints.maxLabel}
                                                </span>
                                <!-- Visible picker input - syncs file into hidden remote input via DataTransfer -->
                                <input
                                        type="file"
                                        accept={acceptBanner}
                                        class="sr-only"
                                        onchange={onBannerImageChange}
                                />
                            </label>
                        {/if}

                        {#if bannerImageIssues.length > 0}
                            <FieldError>
                                {#each bannerImageIssues as issue (issue.message)}
                                    <p>{issue.message}</p>
                                {/each}
                            </FieldError>
                        {/if}
                    </Field>


                </FieldGroup>
            </div>


            <DialogFooter>
                <Button
                        type="submit"
                        class="bg-indigo-500 hover:bg-indigo-500/90"
                        disabled={loading}
                >
                    {loading ? 'Updating…' : 'Update Server'}
                </Button>
            </DialogFooter>
        </form>
    </DialogContent>
</Dialog>