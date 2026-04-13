<!-- CreateChannelDialog.svelte -->
<script lang="ts">
    import type { ServerChannelType } from "$lib/types/server";
    import { CircleAlert, Lock } from "@lucide/svelte";

    import Button from "$lib/components/ui/button/button.svelte";
    import Input from "$lib/components/ui/input/input.svelte";

    import Dialog from "$lib/components/ui/dialog/dialog.svelte";
    import DialogTitle from "$lib/components/ui/dialog/dialog-title.svelte";
    import DialogContent from "$lib/components/ui/dialog/dialog-content.svelte";
    import DialogHeader from "$lib/components/ui/dialog/dialog-header.svelte";
    import DialogFooter from "$lib/components/ui/dialog/dialog-footer.svelte";

    import {Field, FieldGroup, FieldLabel, FieldError, FieldDescription, FieldContent} from "$lib/components/ui/field";

    import Select from "$lib/components/ui/select/select.svelte";
    import SelectTrigger from "$lib/components/ui/select/select-trigger.svelte";
    import SelectContent from "$lib/components/ui/select/select-content.svelte";
    import SelectItem from "$lib/components/ui/select/select-item.svelte";

    import { createChannel } from "$lib/remote/channel/create.remote";
    import {Switch} from "$lib/components/ui/switch";

    interface CreateChannelProps {
        isCreateChannelDialogOpen: boolean;
        predefinedChannelType?: ServerChannelType;
        currentServerId: string;
    }

    let {
        isCreateChannelDialogOpen = $bindable(),
        predefinedChannelType,
        currentServerId,
    }: CreateChannelProps = $props();

    let isPrivate = $state(false);


    let channelType = $derived<string>(predefinedChannelType ?? "TEXT");

    const channelTypes = [
        { value: "TEXT",  label: "Text"  },
        { value: "VOICE", label: "Voice" },
        { value: "VIDEO", label: "Video" },
    ];

    const channelLabel = $derived(
        channelTypes.find((t) => t.value === channelType)?.label ?? "Text"
    );

    const globalIssues = $derived(
        createChannel.fields.allIssues()?.filter(i => !i.path || i.path.length === 0) ?? []
    );
</script>

<Dialog bind:open={isCreateChannelDialogOpen}>
    <DialogContent class="sm:max-w-106.25">
        <DialogHeader>
            <DialogTitle>Create Channel</DialogTitle>
        </DialogHeader>

        <form
                {...createChannel.enhance(async ({ submit, form }) => {
                    await submit();
                    form.reset();
                    isPrivate = false;
                    isCreateChannelDialogOpen = false;
                })}
                oninput={() => createChannel.validate()}
                class="flex flex-col gap-6 mt-2"
        >
            <!-- Hidden server ID — passed as a form field -->
            <input type="hidden" name="serverId" value={currentServerId} />

            <!-- Global errors -->
            {#if globalIssues.length > 0}
                <div class="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-3 flex items-start gap-2">
                    <CircleAlert class="w-5 h-5 mt-0.5 shrink-0" />
                    <div class="flex flex-col gap-1 text-sm">
                        {#each globalIssues as issue (issue)}
                            <p>{issue.message}</p>
                        {/each}
                    </div>
                </div>
            {/if}

            <FieldGroup class="gap-2">

                <!-- Channel Name -->
                <Field data-invalid={(createChannel.fields.channelName?.issues() ?? []).length > 0}>
                    <FieldLabel for="channelName">Channel Name</FieldLabel>
                    <Input
                            {...createChannel.fields.channelName.as('text')}
                            placeholder="Enter a unique channel name"
                    />
                    <FieldError>
                        {#each createChannel.fields.channelName.issues() ?? [] as issue (issue)}
                            <p>{issue.message}</p>
                        {/each}
                    </FieldError>
                </Field>

                <!-- Channel Type -->
                <Field data-invalid={(createChannel.fields.channelType?.issues() ?? []).length > 0}>
                    <FieldLabel>Channel Type</FieldLabel>

                    <!-- Custom UI — purely visual -->
                    <Select type="single" bind:value={channelType}>
                        <SelectTrigger>{channelLabel}</SelectTrigger>
                        <SelectContent>
                            {#each channelTypes as ct (ct.value)}
                                <SelectItem value={ct.value} label={ct.label} />
                            {/each}
                        </SelectContent>
                    </Select>

                    <!-- Native select owned by the remote field -->
                    <select
                            {...createChannel.fields.channelType.as('select')}
                            bind:value={channelType}
                            class="sr-only"
                            tabindex="-1"
                            aria-hidden="true"
                    >
                        {#each channelTypes as ct (ct.value)}
                            <option value={ct.value}>{ct.label}</option>
                        {/each}
                    </select>

                    <FieldError>
                        {#each createChannel.fields.channelType.issues() ?? [] as issue (issue)}
                            <p>{issue.message}</p>
                        {/each}
                    </FieldError>
                </Field>

                <!-- Private Channel Toggle -->
                <Field
                        data-invalid={(createChannel.fields.isPrivateChannel?.issues() ?? []).length > 0}
                        class="rounded-md border border-border bg-muted/40 p-3 transition-colors hover:bg-muted/70"
                >
                    <input
                            {...createChannel.fields.isPrivateChannel.as('checkbox')}
                            class="hidden"
                            checked={isPrivate}
                    />

                    <div class="flex items-center justify-between w-full">
                        <div class="flex items-center gap-3">
                            <div class="flex size-8 items-center justify-center rounded-full bg-background">
                                <Lock class="size-4 text-muted-foreground" />
                            </div>
                            <FieldContent>
                                <FieldLabel for="isPrivateChannel" class="text-sm font-medium cursor-pointer">
                                    Private Channel
                                </FieldLabel>
                                <FieldDescription class="text-xs text-muted-foreground">
                                    Only admins, moderators, and allowed members can view
                                </FieldDescription>
                            </FieldContent>
                        </div>

                        <Switch
                                id="isPrivateChannel"
                                bind:checked={isPrivate}
                                aria-label="Toggle private channel"
                        />
                    </div>

                    <FieldError>
                        {#each createChannel.fields.isPrivateChannel.issues() ?? [] as issue (issue)}
                            <p>{issue.message}</p>
                        {/each}
                    </FieldError>
                </Field>

            </FieldGroup>

            <DialogFooter>
                <Button type="submit" class="bg-indigo-500 text-foreground hover:bg-indigo-500/90">
                    Create
                </Button>
            </DialogFooter>
        </form>
    </DialogContent>
</Dialog>