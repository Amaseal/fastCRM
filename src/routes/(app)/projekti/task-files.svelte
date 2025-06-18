<script lang="ts">
	import DownloadIcon from '@lucide/svelte/icons/download';
	import { type SuperForm } from 'sveltekit-superforms';
	import type { z } from 'zod';
	import type { taskSchema } from './schema';
	import { browser } from '$app/environment';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';

	const flash = getFlash(page);

	// Props
	const {
		form = undefined,
		existingFiles = [],
		taskId = undefined
	} = $props<{
		form?: SuperForm<z.infer<typeof taskSchema>>;
		existingFiles?: { id: number; filename: string; downloadUrl: string; size: number }[];
		taskId?: number;
	}>(); // Types
	type FileUpload = {
		file: File;
		fileId?: number;
		downloadUrl?: string;
		uploading: boolean;
		progress: number;
		error: boolean;
	};

	// State
	let fileInput = $state<HTMLInputElement | null>(null);
	let dragActive = $state(false);
	let uploadedFiles = $state<FileUpload[]>([]);
	let dbFiles = $state([...existingFiles]);

	// Form data reference
	const formData = form?.form;

	// Update form files when files change
	$effect(() => {
		if (formData) {
			const allFileIds = [
				...dbFiles.map((f) => f.id),
				...uploadedFiles.filter((f) => f.fileId).map((f) => f.fileId!)
			];
			$formData.files = allFileIds;
		}
	});

	// Load existing files on initialization
	$effect(() => {
		if (
			formData &&
			$formData?.files?.length &&
			dbFiles.length === 0 &&
			uploadedFiles.length === 0
		) {
			loadExistingFiles($formData.files);
		}
	});

	// Utility functions
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
		return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
	}
	async function loadExistingFiles(fileIds: number[]) {
		try {
			const files = await Promise.all(
				fileIds.map(async (id) => {
					const response = await fetch(`/api/taskfiles?id=${id}`);
					if (response.ok) {
						const data = await response.json();
						if (data.success) {
							return {
								id,
								filename: data.filename,
								downloadUrl: data.url, // This is the correct download URL
								size: data.size
							};
						}
					}
					return null;
				})
			);

			dbFiles = files.filter((f) => f !== null) as typeof dbFiles;
		} catch (error) {
			console.error('Error loading existing files:', error);
		}
	} // File upload
	async function uploadFile(
		file: File
	): Promise<{ success: boolean; fileId?: number; downloadUrl?: string; error?: string }> {
		if (!browser) return { success: false, error: 'Not in browser' };

		const formData = new FormData();
		formData.append('file', file);
		if (taskId !== undefined) {
			formData.append('taskId', String(taskId));
		}

		try {
			const response = await fetch('/api/taskfiles', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					return { success: true, fileId: result.fileId, downloadUrl: result.url };
				}
			}

			return { success: false, error: 'Upload failed' };
		} catch (error) {
			return { success: false, error: 'Network error' };
		}
	}
	async function handleFiles(files: File[]) {
		for (const file of files) {
			// Add to upload list
			const newUpload: FileUpload = {
				file,
				uploading: true,
				progress: 0,
				error: false
			};
			uploadedFiles = [...uploadedFiles, newUpload];

			// Upload file
			const result = await uploadFile(file); // Update file state
			uploadedFiles = uploadedFiles.map((f) =>
				f.file === file
					? {
							...f,
							uploading: false,
							error: !result.success,
							fileId: result.fileId,
							downloadUrl: result.downloadUrl
						}
					: f
			);
			if (result.success) {
				$flash = { type: 'success', message: `Veiksmīgi augšuplādēts: ${file.name}` };
			} else {
				$flash = { type: 'error', message: `Neizdevās augšuplādēt: ${file.name}` };
			}
		}
	}

	// Event handlers
	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragActive = false;
		if (event.dataTransfer?.files) {
			handleFiles(Array.from(event.dataTransfer.files));
		}
	}

	function onDragOver(event: DragEvent) {
		event.preventDefault();
		dragActive = true;
	}

	function onDragLeave(event: DragEvent) {
		event.preventDefault();
		dragActive = false;
	}

	function onFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files?.length) {
			handleFiles(Array.from(target.files));
			target.value = '';
		}
	}

	function triggerFileInput() {
		fileInput?.click();
	}

	// File management
	async function removeDbFile(index: number) {
		const file = dbFiles[index];
		try {
			const response = await fetch('/api/taskfiles', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ fileId: file.id })
			});
			if (response.ok) {
				$flash = { type: 'success', message: 'Fails noņemts' };
			} else {
				$flash = { type: 'error', message: 'Neizdevās noņemt failu' };
			}
		} catch (error) {
			$flash = { type: 'error', message: 'Kļūda noņemot failu' };
		}

		// Remove from UI regardless of server result
		dbFiles = dbFiles.filter((_, i) => i !== index);
	}

	async function removeUploadedFile(index: number) {
		const file = uploadedFiles[index];

		if (file.fileId) {
			try {
				await fetch('/api/taskfiles', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ fileId: file.fileId })
				});
			} catch (error) {
				console.error('Error deleting file:', error);
			}
		}

		uploadedFiles = uploadedFiles.filter((_, i) => i !== index);
	}

	async function retryUpload(index: number) {
		const fileData = uploadedFiles[index];
		uploadedFiles[index] = { ...fileData, uploading: true, error: false };

		const result = await uploadFile(fileData.file);
		uploadedFiles[index] = {
			...fileData,
			uploading: false,
			error: !result.success,
			fileId: result.fileId,
			downloadUrl: result.downloadUrl
		};
		if (result.success) {
			$flash = { type: 'success', message: `Veiksmīgi augšuplādēts: ${fileData.file.name}` };
		} else {
			$flash = { type: 'error', message: `Neizdevās augšuplādēt: ${fileData.file.name}` };
		}
	}

	function downloadFile(file: { downloadUrl: string; filename: string }) {
		const link = document.createElement('a');
		link.href = file.downloadUrl;
		link.download = file.filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<!-- File Drop Zone -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="mb-3 block w-full cursor-pointer rounded-lg border-2 border-dashed transition-colors duration-200
		{dragActive ? 'border-violet-500 bg-violet-950/20' : 'bg-input/30 border-neutral-600'} 
		px-4 py-3 text-center text-sm"
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	ondrop={onDrop}
	onclick={triggerFileInput}
	tabindex="0"
	role="button"
>
	<p class="text-sm {dragActive ? 'text-violet-300' : 'text-neutral-500'}">
		Darba failus var iemest vai izvēlēties šeit.
	</p>

	<input type="file" multiple class="hidden" onchange={onFileChange} bind:this={fileInput} />
</div>

<!-- Files List -->
<div class="mb-3 flex flex-wrap gap-2">
	{#if dbFiles.length === 0 && uploadedFiles.length === 0}
		<div class="w-full py-1 text-center text-xs text-neutral-500 italic">Nav pievienotu failu</div>
	{/if}

	<!-- Existing Files -->
	{#each dbFiles as file, index}
		<div class="flex items-center gap-2 rounded bg-gray-100 px-2 py-1 text-xs dark:bg-zinc-900">
			<div class="max-w-28 truncate" title="{file.filename} ({formatFileSize(file.size)})">
				{file.filename.length > 15 ? `${file.filename.slice(0, 12)}...` : file.filename}
				<span class="ml-1 text-xs text-gray-500">
					({formatFileSize(file.size)})
				</span>
			</div>

			<button
				type="button"
				class="text-sm text-blue-500 hover:text-blue-700"
				onclick={() => downloadFile(file)}
				title="Download"
			>
				<DownloadIcon size={14} />
			</button>

			<button
				type="button"
				class="text-sm text-red-500 hover:text-red-700"
				onclick={() => removeDbFile(index)}
				title="Remove"
			>
				✕
			</button>
		</div>
	{/each}

	<!-- Uploaded Files -->
	{#each uploadedFiles as file, index}
		<div class="flex items-center gap-2 rounded bg-gray-100 px-2 py-1 text-xs dark:bg-zinc-900">
			<div class="max-w-28 truncate" title="{file.file.name} ({formatFileSize(file.file.size)})">
				{file.file.name.length > 15 ? `${file.file.name.slice(0, 12)}...` : file.file.name}
				<span class="ml-1 text-xs text-gray-500">
					({formatFileSize(file.file.size)})
				</span>
			</div>

			{#if file.uploading}
				<div class="text-xs text-blue-500">Uploading...</div>
			{:else if file.error}
				<button
					onclick={() => retryUpload(index)}
					class="text-xs text-yellow-500 hover:text-yellow-700"
					title="Retry upload"
				>
					Retry
				</button>
			{:else if file.fileId && file.downloadUrl}
				<button
					type="button"
					class="text-sm text-blue-500 hover:text-blue-700"
					onclick={() =>
						downloadFile({
							downloadUrl: file.downloadUrl!,
							filename: file.file.name
						})}
					title="Download"
				>
					<DownloadIcon size={14} />
				</button>
			{/if}

			<button
				type="button"
				class="text-sm text-red-500 hover:text-red-700"
				onclick={() => removeUploadedFile(index)}
				title="Remove"
			>
				✕
			</button>
		</div>
	{/each}
</div>

<!-- Hidden form inputs -->
{#if formData}
	{#each $formData.files || [] as fileId}
		<input type="hidden" name="files" value={fileId} />
	{/each}
{/if}
