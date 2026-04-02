<script lang="ts">
    import { Plus, Camera, Trash2, CircleAlert, Lock } from '@lucide/svelte'

    import {createServer} from "$lib/remote/server/create.remote";
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

    import { Dialog, DialogTrigger, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "$lib/components/ui/dialog";

    let open = $state(false)

    let loading = $state(false)
    let isPrivateServer = $state(false)

    const imageConstraints = UPLOAD_CONSTRAINTS.serverImage
    const accept = imageConstraints.allowedTypes.join(',')

    let imageFile = $state<File | null>(null)
    let imagePreview = $state<string | null>(null)
    const imageIssues = $derived(createServer.fields.serverImage?.issues() ?? [])

    function onImageChange(e: Event) {
        const input = e.target as HTMLInputElement
        const file = input.files?.[0] ?? null
        input.value = ''

        if (!file) return

        if (imagePreview) URL.revokeObjectURL(imagePreview)
        imageFile = file
        imagePreview = URL.createObjectURL(file)

        const hiddenInput = document.querySelector<HTMLInputElement>('input[name="serverImage"]')
        if (hiddenInput) {
            const dt = new DataTransfer()
            dt.items.add(file)
            hiddenInput.files = dt.files
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }))
        }
    }

    function removeImage() {
        if (imagePreview) URL.revokeObjectURL(imagePreview)
        imageFile = null
        imagePreview = null

        const hiddenInput = document.querySelector<HTMLInputElement>('input[name="serverImage"]')
        if (hiddenInput) {
            hiddenInput.value = ''
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }))
        }
    }
</script>

<Dialog bind:open>
    <DialogTrigger
            class="flex mx-3 h-12 w-12 rounded-3xl hover:rounded-2xl transition-all overflow-hidden
               items-center justify-center bg-background dark:bg-neutral-700 hover:bg-emerald-500 group"
    >
        <Plus class="text-emerald-500 group-hover:text-white transition-colors" size="25" />
    </DialogTrigger>

    <DialogContent class="sm:max-w-md">
        <DialogHeader>
            <DialogTitle>Create a Server</DialogTitle>
            <DialogDescription>
                Give your server a name and an image. You can always change these later.
            </DialogDescription>
        </DialogHeader>

        <form {...createServer.enhance(async ({ submit, form }) => {
            await submit();
            form.reset();
            open = false;
        })}
        oninput={() => createServer.validate()}
        enctype="multipart/form-data"
        class="flex flex-col gap-5">

            <!-- Global-level errors -->
            {#if (createServer.fields.allIssues()?.some(issue => !issue.path || issue.path.length === 0))}
                <div class="mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-3 flex items-start gap-2">
                    <CircleAlert class="w-5 h-5 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
                    <div class="flex flex-col gap-1 text-sm">
                        {#each (createServer.fields.allIssues()?.filter(issue => !issue.path || issue.path.length === 0)) ?? [] as issue (issue)}
                            <p>{issue.message}</p>
                        {/each}
                    </div>
                </div>
            {/if}

            <div>
                <FieldGroup class="gap-2">

                    <!-- Server Name -->
                    <Field data-invalid={(createServer.fields.serverName?.issues() ?? []).length > 0}>
                        <FieldLabel for="serverName">Server Name</FieldLabel>
                        <Input {...createServer.fields.serverName.as('text')} placeholder="Enter a unique server name"/>
                        <FieldError>
                            {#each createServer.fields.serverName.issues() ?? [] as issue (issue)}
                                <p>{issue.message}</p>
                            {/each}
                        </FieldError>
                    </Field>

                    <!-- Server Description -->
                    <Field data-invalid={(createServer.fields.serverDescription?.issues() ?? []).length > 0}>
                        <FieldLabel for="serverDescription">Server Name</FieldLabel>
                        <Input {...createServer.fields.serverDescription.as('text')} placeholder="What's this server about?"/>
                        <FieldError>
                            {#each createServer.fields.serverDescription.issues() ?? [] as issue (issue)}
                                <p>{issue.message}</p>
                            {/each}
                        </FieldError>
                    </Field>

                    <!-- Server Privacy -->
                    <Field
                            data-invalid={(createServer.fields.isPrivateServer?.issues() ?? []).length > 0}
                            class="rounded-lg border border-border bg-muted/40 p-4 transition-colors hover:bg-muted/70"
                    >
                        <input
                                {...createServer.fields.isPrivateServer.as('checkbox')}
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
                            {#each createServer.fields.isPrivateServer.issues() ?? [] as issue (issue)}
                                <p>{issue.message}</p>
                            {/each}
                        </FieldError>
                    </Field>

                    <!-- Server Image -->
                    <Field data-invalid={imageIssues.length > 0}>
                        <FieldLabel>Server Image</FieldLabel>

                        <!-- Hidden input owned by the remote field - drives FormData on submit -->
                        <input
                                {...createServer.fields.serverImage.as('file')}
                                accept={accept}
                                class="sr-only"
                                tabindex="-1"
                                aria-hidden="true"
                        />

                        {#if imagePreview}
                            <div class="relative w-20 h-20 rounded-full overflow-hidden bg-muted">
                                <img src={imagePreview} alt="Server preview" class="w-full h-full object-cover" />
                                <button
                                        type="button"
                                        onclick={removeImage}
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
                                   transition-colors {imageIssues.length > 0 ? 'border-destructive' : 'border-border'}"
                            >
                                <Camera class="size-6 text-muted-foreground" />
                                <span class="text-xs text-muted-foreground">
                                {imageConstraints.allowedLabel} · Max {imageConstraints.maxLabel}
                            </span>
                                <!-- Visible picker input - syncs file into hidden remote input via DataTransfer -->
                                <input
                                        type="file"
                                        accept={accept}
                                        class="sr-only"
                                        onchange={onImageChange}
                                />
                            </label>
                        {/if}

                        {#if imageIssues.length > 0}
                            <FieldError>
                                {#each imageIssues as issue (issue.message)}
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
                    {loading ? 'Creating…' : 'Create Server'}
                </Button>
            </DialogFooter>
        </form>
    </DialogContent>
</Dialog>