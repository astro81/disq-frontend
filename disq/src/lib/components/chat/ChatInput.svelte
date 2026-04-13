<!-- ChatInput.svelte -->
<script lang="ts">
	import {
		sendMessage,
		sendFile,
		sendMessageWithFile,
		socketState,
		type FileAttachment
	} from '$lib/stores/socket.svelte';
	import { Paperclip, Send, X, FileIcon, Code } from '@lucide/svelte';
	import AttachmentUploadDialog from '../attachment/AttachmentUploadDialog.svelte';
	import CodeSnippetDialog from '../snippet/CodeSnippetDialog.svelte';
	import { ATTACHMENT_UPLOAD_CONSTRAINTS } from '$lib/constants/upload';

	interface Props {
		channelName: string;
	}

	let { channelName }: Props = $props();

	// Input state
	let input = $state('');
	let isConnected = $derived(socketState.current === 'open');
	let dialogOpen = $state(false);
	let snippetDialogOpen = $state(false);
	let fileUploading = $state(false);
	let fileError = $state<string | null>(null);
	let pendingFile = $state<FileAttachment | null>(null);

	const isPendingImage = $derived(pendingFile?.mimeType.startsWith('image/') ?? false);

	// Upload

	/**
	 * POST the raw File to /api/attachments and stage the response
	 * as a `pendingFile` — it will be sent with the next message.
	 */
	async function handleFileUpload(file: File): Promise<void> {
		fileUploading = true;
		fileError = null;

		try {
			const fd = new FormData();
			fd.append('file', file);

			const res = await fetch('/api/attachments', { method: 'POST', body: fd });
			const body = await res.json();

			if (!res.ok) throw new Error(body.error ?? 'Upload failed');

			pendingFile = {
				url: body.url,
				publicId: body.publicId,
				name: body.fileName,
				size: body.fileSize,
				mimeType: body.mimeType
			};
		} catch (e) {
			fileError = e instanceof Error ? e.message : 'Upload failed';
		} finally {
			fileUploading = false;
		}
	}

	function removePendingFile() {
		pendingFile = null;
		fileError = null;
	}

	// Code snippet

	/**
	 * Encode a code snippet as a fenced markdown block and send it
	 * as a plain message. The receiver detects the ``` wrapper and
	 * routes it to the <CodeBlock> component.
	 */
	function handleSendSnippet(code: string, language: string, theme: string) {
		if (!isConnected) return;

		// Encode theme in the info string: ```lang theme:tokyo-night
		const fenced = `\`\`\`${language} theme:${theme}\n${code}\n\`\`\``;
		// const fenced = `\`\`\`${language}\n${code}\n\`\`\``

		sendMessage(fenced);
	}

	//* Send

	/**
	 * Send the current text-only message.
	 * Called directly when the user has no pending file.
	 */
	function handleSend() {
		const text = input.trim();
		if (!text || !isConnected) return;
		sendMessage(text);
		input = '';
	}

	/**
	 * Send the staged file without any caption text.
	 * Called when the user hits Send with a file but no typed text.
	 */
	function handleSendFile() {
		if (!pendingFile || !isConnected) return;
		sendFile(pendingFile);
		pendingFile = null;
	}

	/**
	 * Primary send handler — decides which path to take:
	 *   • file + text  - sendMessageWithFile
	 *   • file only    - handleSendFile
	 *   • text only    - handleSend
	 */
	function handleSubmit() {
		if (!isConnected) return;
		const text = input.trim();

		if (pendingFile && text) {
			sendMessageWithFile(text, pendingFile);
			input = '';
			pendingFile = null;
		} else if (pendingFile) {
			handleSendFile();
		} else {
			handleSend();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}

	// Formatting
	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<AttachmentUploadDialog
	bind:open={dialogOpen}
	uploading={fileUploading}
	constraints={ATTACHMENT_UPLOAD_CONSTRAINTS.attachment}
	onConfirm={handleFileUpload}
/>

<!-- Code snippet dialog -->
<CodeSnippetDialog bind:open={snippetDialogOpen} onSend={handleSendSnippet} />

<div class="flex flex-col border-t border-neutral-200 dark:border-neutral-800">
	<!-- Error toast -->
	{#if fileError}
		<div
			class="mx-4 mt-2 flex animate-in items-center gap-2 rounded-md border
                    border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium
                    text-destructive fade-in slide-in-from-bottom-1"
		>
			<span class="flex-1">Error: {fileError}</span>
			<button
				type="button"
				onclick={() => (fileError = null)}
				class="underline opacity-70 hover:opacity-100"
			>
				Dismiss
			</button>
		</div>
	{/if}

	<!-- Pending-file preview strip -->
	{#if pendingFile}
		<div
			class="mx-4 mt-2 flex animate-in items-center gap-2.5 rounded-xl border
                    border-zinc-200 bg-zinc-50 px-3 py-2 fade-in
                    slide-in-from-bottom-1 dark:border-zinc-700 dark:bg-zinc-800/60"
		>
			{#if isPendingImage}
				<!-- Thumbnail for images -->
				<div
					class="size-10 shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-600"
				>
					<img src={pendingFile.url} alt={pendingFile.name} class="size-full object-cover" />
				</div>
			{:else}
				<!-- Icon badge for non-image files -->
				<div
					class="flex size-10 shrink-0 items-center justify-center rounded-lg
                            bg-indigo-100 dark:bg-indigo-900/40"
				>
					<FileIcon class="size-4 text-indigo-600 dark:text-indigo-400" />
				</div>
			{/if}

			<div class="min-w-0 flex-1">
				<p class="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
					{pendingFile.name}
				</p>
				<p class="text-[10px] text-zinc-400">{formatBytes(pendingFile.size)}</p>
			</div>

			<button
				type="button"
				onclick={removePendingFile}
				aria-label="Remove attachment"
				class="ml-1 shrink-0 rounded-full p-1 text-zinc-400
                       transition-colors hover:bg-zinc-200
                       hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
			>
				<X class="size-3.5" />
			</button>
		</div>
	{/if}

	<!-- Input row -->
	<div class="flex items-center gap-2 px-4 py-3">
		<!-- File attachment button -->
		<button
			type="button"
			onclick={() => (dialogOpen = true)}
			aria-label="Upload file"
			class="flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors
                   {pendingFile
				? 'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/30'
				: 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
		>
			<Paperclip class="size-5" />
		</button>

		<!-- Code snippet button -->
		<button
			type="button"
			onclick={() => (snippetDialogOpen = true)}
			aria-label="Send code snippet"
			disabled={!isConnected}
			title="Send code snippet"
			class="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-500
                   transition-colors hover:bg-zinc-100 hover:text-indigo-500
                   disabled:cursor-not-allowed disabled:opacity-40
                   dark:hover:bg-zinc-800 dark:hover:text-indigo-400"
		>
			<Code class="size-5" />
		</button>

		<input
			bind:value={input}
			onkeydown={handleKeydown}
			disabled={!isConnected}
			placeholder={isConnected ? `Message #${channelName}` : 'Connecting…'}
			class="flex-1 rounded-lg bg-zinc-100 px-4 py-2 text-sm outline-none
  	  	           placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-50
  	  	           dark:bg-zinc-800 dark:text-zinc-100"
		/>

		<button
			onclick={handleSubmit}
			disabled={!isConnected || (!input.trim() && !pendingFile)}
			class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600
  	               text-white transition hover:bg-indigo-500
  	               disabled:cursor-not-allowed disabled:opacity-40"
		>
			<Send class="size-4" />
		</button>
	</div>
</div>
