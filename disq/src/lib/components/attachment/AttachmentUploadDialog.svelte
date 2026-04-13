<!-- AttachmentUploadDialog.svelte -->
<script lang="ts">
    import { FileIcon, Trash2, Upload, Paperclip } from '@lucide/svelte'
    import { Button } from '$lib/components/ui/button/index.js'
    import * as Dialog from '$lib/components/ui/dialog/index.js'
    import { ATTACHMENT_ALLOWED_TYPES } from '$lib/constants/upload'

    interface AttachmentUploadProps {
        open: boolean;
        uploading?: boolean;
        constraints: {
            maxBytes: number;
            maxLabel: string;
            // folder?: string;
        }
        onConfirm: (file: File) => Promise<void>;
    }

    let {
        open = $bindable(false),
        uploading = false,
        constraints,
        onConfirm
    }: AttachmentUploadProps = $props()

    let selectedFile = $state<File | null>(null)
    let previewUrl = $state<string | null>(null)
    let validationError = $state<string | null>(null)

    // Derived values
    const isImage = $derived(selectedFile?.type.startsWith('image/'))
    const accept = $derived(ATTACHMENT_ALLOWED_TYPES.join(','))

    function onFileChange(e: Event) {
        const input = e.target as HTMLInputElement
        const file = input.files?.[0] ?? null
        input.value = ''
        validationError = null
        if (!file) return

        if (!(ATTACHMENT_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
            validationError = `File type ${file.type} is not supported.`
            return
        }
        if (file.size > constraints.maxBytes) {
            validationError = `File too large. Max: ${constraints.maxLabel}.`
            return
        }

        selectedFile = file
        if (file.type.startsWith('image/')) {
            previewUrl = URL.createObjectURL(file)
        }
    }

    function removeSelected() {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        selectedFile = null
        previewUrl = null
        validationError = null
    }

    function handleOpenChange(value: boolean) {
        if (!value) removeSelected()
        open = value
    }

    async function confirm() {
        if (!selectedFile) return
        try {
            await onConfirm(selectedFile)
            handleOpenChange(false)
        } catch {
            validationError = "Upload failed. Please try again."
        }
    }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
    <Dialog.Content class="sm:max-w-106.25">
        <Dialog.Header>
            <Dialog.Title>Upload Attachment</Dialog.Title>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            {#if selectedFile}
                <div class="relative flex flex-col items-center justify-center rounded-lg border bg-muted p-6 text-center">
                    {#if isImage && previewUrl}
                        <img src={previewUrl} alt="Preview" class="max-h-40 rounded-md object-contain shadow-sm" />
                    {:else}
                        <FileIcon class="size-12 text-muted-foreground mb-2" />
                        <span class="text-sm font-medium truncate max-w-full px-4">
                            {selectedFile.name}
                        </span>
                        <span class="text-xs text-muted-foreground">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                    {/if}

                    <button
                            type="button"
                            onclick={removeSelected}
                            class="absolute top-2 right-2 rounded-full bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                        <Trash2 class="size-4" />
                    </button>
                </div>
            {:else}
                <label
                        class="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/40 py-10 cursor-pointer hover:bg-muted/60 hover:border-muted-foreground/50 transition-all"
                >
                    <div class="rounded-full bg-background p-3 shadow-sm">
                        <Paperclip class="size-6 text-primary" />
                    </div>
                    <div class="text-center">
                        <p class="text-sm font-medium">Click to upload a file</p>
                        <p class="text-xs text-muted-foreground mt-1">Up to {constraints.maxLabel}</p>
                    </div>
                    <input type="file" {accept} class="sr-only" onchange={onFileChange} />
                </label>
            {/if}

            {#if validationError}
                <p class="text-sm font-medium text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
                    {validationError}
                </p>
            {/if}
        </div>

        <Dialog.Footer>
            <Button variant="ghost" onclick={() => handleOpenChange(false)} disabled={uploading}>
                Cancel
            </Button>
            <Button onclick={confirm} disabled={!selectedFile || uploading} class="min-w-25">
                {#if uploading}
                    <div class="size-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    Uploading
                {:else}
                    <Upload class="size-4 mr-2" />
                    Upload
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>