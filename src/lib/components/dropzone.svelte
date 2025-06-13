<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	const flash = getFlash(page);

	// Props
	let {
		name,
		accept = 'image/*',
		disabled = false,
		placeholder = 'Klikšķini vai ievelc šeit lai pievienotu bildi',
		value = $bindable()
	} = $props<{
		name?: string;
		accept?: string;
		disabled?: boolean;
		placeholder?: string;
		value?: string; // For SvelteSuperForms binding
	}>();

	// State
	let dropzone: HTMLDivElement | undefined = $state();
	let isDragging: boolean = $state(false);
	let fileInput: HTMLInputElement;
	let imagePath: string | null = $state(null);
	let error: string = $state('');
	let isUploading: boolean = $state(false);
	let uploadProgress: number = $state(0);

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
		else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
		return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
	}

	function handleDragOver(e: DragEvent): void {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(): void {
		isDragging = false;
	}

	function handleDrop(e: DragEvent): void {
		e.preventDefault();
		isDragging = false;

		if (disabled || !e.dataTransfer) return;

		const droppedFiles = Array.from(e.dataTransfer.files);
		if (droppedFiles.length > 0) {
			processFile(droppedFiles[0]);
		}
	}

	function handleFileInputChange(e: Event): void {
		const target = e.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;

		const selectedFiles = Array.from(target.files);
		if (selectedFiles.length > 0) {
			processFile(selectedFiles[0]);
		}
	}

	function handlePaste(e: ClipboardEvent): void {
		if (disabled) return;

		const clipboardItems = e.clipboardData?.items;
		if (!clipboardItems) return;

		// Check if we have an image in the clipboard
		let hasImage = false;
		let imageFile = null;

		for (let i = 0; i < clipboardItems.length; i++) {
			if (clipboardItems[i].type.indexOf('image') !== -1) {
				hasImage = true;
				imageFile = clipboardItems[i].getAsFile();
				break;
			}
		}

		if (!hasImage || !imageFile) return;

		// Stop the event and process the image
		e.preventDefault();
		e.stopPropagation();
		processFile(imageFile);
	}

	async function processFile(file: File): Promise<void> {
		if (!browser) return;

		error = '';

		const uploadData = new FormData();
		uploadData.append('file', file);

		isUploading = true;
		uploadProgress = 0;

		try {
			const res = await fetch('/api/upload', {
				method: 'POST',
				body: uploadData
			});
			const data = await res.json();

			if (data.success && data.path) {
				imagePath = data.path;
				value = data.path;
				uploadProgress = 100;
				$flash = { type: 'success', message: 'Bilde augšuplādēta veiksmīgi!' };
			} else {
				error = 'Kaut kas nogāja greizi!';
				$flash = { type: 'error', message: 'Kaut kas nogāja greizi!' };
			}
		} catch (e) {
			error = 'Upload failed';
			$flash = { type: 'error', message: 'Kaut kas nogāja greizi!' };
		} finally {
			isUploading = false;
		}
	}

	async function clearFile(): Promise<void> {
		if (!browser) return;

		if (imagePath) {
			try {
				await fetch('/api/remove', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ path: imagePath })
				});
			} catch (e) {
				$flash = { type: 'error', message: 'Kaut kas nogāja greizi!' };
			}
		}

		imagePath = null;
		value = '';
		if (fileInput) fileInput.value = '';
		$flash = { type: 'success', message: 'Bilde izdzēsta veiksmīgi!' };
	}
	// Clean up event listeners
	onMount(() => {
		if (!browser) return;

		// Add drag and drop handlers to the dropzone
		if (dropzone) {
			dropzone.addEventListener('dragover', handleDragOver);
			dropzone.addEventListener('dragleave', handleDragLeave);
			dropzone.addEventListener('drop', handleDrop);
		}

		// Add paste handler to document
		document.addEventListener('paste', handlePaste);
	});

	onDestroy(() => {
		if (!browser) return;

		// Clean up drag and drop handlers
		if (dropzone) {
			dropzone.removeEventListener('dragover', handleDragOver);
			dropzone.removeEventListener('dragleave', handleDragLeave);
			dropzone.removeEventListener('drop', handleDrop);
		}

		// Clean up paste handler
		document.removeEventListener('paste', handlePaste);
	});

	// Handle when the component is initialized with a value from SvelteSuperForms
	$effect(() => {
		if (value && !imagePath) {
			imagePath = value;
		}
	});
</script>

<div class="w-full">
	<!-- Hidden file input -->
	<input
		bind:this={fileInput}
		type="file"
		{name}
		{accept}
		{disabled}
		class="hidden"
		onchange={handleFileInputChange}
	/>

	<!-- Drop Zone -->
	<div
		bind:this={dropzone}
		class="bg-input/30 flex h-[60vh] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 text-center transition-colors
		{isDragging
			? 'border-violet-500 bg-violet-50 dark:bg-zinc-950'
			: 'border-gray-200 dark:border-neutral-700'}
		{disabled ? 'pointer-events-none opacity-50' : ''}"
		onclick={() => !disabled && fileInput.click()}
		role="button"
		tabindex="0"
		onkeydown={(e: KeyboardEvent) => e.key === 'Enter' && !disabled && fileInput.click()}
	>
		{#if imagePath}
			<div class="flex items-center gap-3">
				<div class="relative">
					<img src={imagePath} alt="preview" class="h-[55vh] w-full rounded-lg object-contain" />

					{#if isUploading}
						<!-- Upload progress overlay -->
						<div class="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
							<div class="flex flex-col items-center gap-2">
								<Loader2 class="h-5 w-5 animate-spin text-white" />
								<div class="h-1 w-16 overflow-hidden rounded bg-zinc-700">
									<div class="h-full bg-violet-500" style="width: {uploadProgress}%"></div>
								</div>
								<span class="text-xs text-white">{uploadProgress}%</span>
							</div>
						</div>
					{/if}
				</div>
			</div>
			<button
				type="button"
				onclick={clearFile}
				class="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
				disabled={isUploading}
			>
				<Trash2 class="h-4 w-4" /> Noņemt
			</button>
		{:else}
			<p class="text-muted-foreground text-center text-sm">
				{placeholder}
			</p>
		{/if}
	</div>

	<!-- Error message -->
	{#if error}
		<div
			class="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
		>
			{error}
		</div>
	{/if}

	<!-- Hidden input for SvelteSuperForms integration -->
	<input type="hidden" {name} bind:value />
</div>
