<script lang="ts">
	import { writable, get } from 'svelte/store';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import { type SuperForm } from 'sveltekit-superforms';
	import type { z } from 'zod';
	import type { taskSchema } from './schema';
	import { toast } from 'svelte-sonner';
	import { browser } from '$app/environment';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';

	const flash = getFlash(page);

	const {
		form = undefined,
		existingFiles = [],
		taskId = undefined
	} = $props<{
		form?: SuperForm<z.infer<typeof taskSchema>>;
		existingFiles?: { id: number; filename: string; downloadUrl: string; size: number }[];
		taskId?: number;
	}>();

	// Extract the form data from the SuperForm object
	const formData = form?.form;

	// Type definitions
	type FileDisplay = {
		file: File;
		fileId?: number; // Database ID after successful upload
		url: string | null;
		uploading: boolean;
		progress: number;
		error: boolean;
		filePath: string | null;
	};

	/**
	 * Helper function to format file sizes for display
	 */
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) {
			return `${bytes} B`;
		} else if (bytes < 1024 * 1024) {
			return `${(bytes / 1024).toFixed(1)} KB`;
		} else if (bytes < 1024 * 1024 * 1024) {
			return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
		} else {
			return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
		}
	}
	// Store for tracking files
	const displayFiles = writable<FileDisplay[]>([]);
	// Store for tracking existing files from the database
	const dbFiles = writable<typeof existingFiles>([...existingFiles]);

	// Use runes with derived for reactive computations
	$effect(() => {
		// Only update files in the form if formData is available
		if (formData && form) {
			const ids = [
				...$dbFiles.map((f: { id: number }) => f.id),
				...$displayFiles
					.filter((f: FileDisplay) => f.fileId !== undefined)
					.map((f: FileDisplay) => f.fileId as number)
			];

			// Update the form data directly
			$formData.files = ids;
		}
	}); // Initialize from form data if available - using $effect for initialization
	$effect(() => {
		// We'll use an IIFE to handle async operations within the effect
		(async () => {
			// Use proper type checking to ensure formData and $formData are defined
			if (
				formData &&
				$formData &&
				$formData.files?.length &&
				$dbFiles.length === 0 &&
				$displayFiles.length === 0
			) {
				console.debug('Initializing files from form data', $formData.files);

				// Fetch file details for each fileId (with retries)
				const fetchFileWithRetries = async (id: number, retries = 2) => {
					for (let attempt = 0; attempt <= retries; attempt++) {
						try {
							const response = await fetch(`/api/taskfiles?id=${id}`);
							if (response.ok) {
								const data = await response.json();
								if (data.success) {
									return {
										id,
										filename: data.filename,
										downloadUrl: data.url,
										size: data.size
									};
								}
							}
							// If not successful and we have retries left, wait before trying again
							if (attempt < retries) {
								await new Promise((resolve) => setTimeout(resolve, 1000));
							}
						} catch (error) {
							console.error(
								`Error fetching file details for ID ${id} (attempt ${attempt + 1}):`,
								error
							);
							if (attempt < retries) {
								await new Promise((resolve) => setTimeout(resolve, 1000));
							}
						}
					}
					return null;
				}; // At this point we know $formData and $formData.files are defined
				const fileIds = $formData.files;
				const files = await Promise.all(fileIds.map((id: number) => fetchFileWithRetries(id)));
				const validFiles = files.filter((f) => f !== null);

				if (validFiles.length) {
					dbFiles.set(validFiles as any[]);
					console.debug('Successfully loaded file details:', validFiles);
				} else if (fileIds.length) {
					console.warn('Could not load file details for any of the IDs', fileIds);
				}
			}
			// Close the IIFE
		})();
	});

	let fileInput = $state<HTMLInputElement | null>(null);
	let dragActive = $state(false);
	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragActive = false;
		if (event.dataTransfer?.files) {
			addFiles(Array.from(event.dataTransfer.files));
		}
	}

	function onDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		dragActive = true;
	}

	function onDragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		dragActive = false;
	}

	function onFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			addFiles(Array.from(target.files));
			target.value = '';
		}
	}

	function triggerFileInput() {
		if (fileInput) {
			fileInput.click();
		}
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			triggerFileInput();
		}
	}
	/**
	 * Upload a file using the task files API
	 * Enhanced with more advanced error handling and validation
	 */ async function uploadFile(file: File, updateProgress: (progress: number) => void) {
		if (!browser) return;

		try {
			// Basic validation - you can expand this as needed
			if (file.size > 10 * 1024 * 1024) {
				// 10MB limit
				return {
					success: false,
					error: 'File exceeds 10MB size limit'
				};
			}

			const formData = new FormData();
			formData.append('file', file);

			// If taskId is provided, attach it to link file directly
			if (taskId !== undefined) {
				formData.append('taskId', String(taskId));
			}

			// Use XMLHttpRequest for progress tracking
			const xhr = new XMLHttpRequest();
			xhr.open('POST', '/api/taskfiles', true);

			// Set up timeout
			xhr.timeout = 60000; // 60 seconds timeout for larger files

			// Set up progress tracking
			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					const percent = Math.round((event.loaded / event.total) * 100);
					updateProgress(percent);
				}
			};

			// Handle the request as a promise
			return new Promise((resolve, reject) => {
				xhr.onload = () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						try {
							const response = JSON.parse(xhr.responseText);
							if (response.success) {
								resolve({
									success: true,
									url: response.url,
									filePath: response.filePath,
									fileId: response.fileId
								});
							} else {
								reject({
									success: false,
									error: response.error || 'Upload failed'
								});
							}
						} catch (e) {
							reject({
								success: false,
								error: 'Invalid response format'
							});
						}
					} else {
						reject({
							success: false,
							error: `HTTP error: ${xhr.status}`
						});
					}
				};

				xhr.onerror = () => {
					reject({
						success: false,
						error: 'Network error'
					});
				};

				xhr.ontimeout = () => {
					reject({
						success: false,
						error: 'Upload timed out'
					});
				};

				xhr.send(formData);
			});
		} catch (error) {
			console.error('Upload error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Update the progress of a file in the store
	 */
	function updateFileProgress(file: File, progress: number) {
		displayFiles.update((currentFiles) =>
			currentFiles.map((f) => (f.file === file ? { ...f, progress } : f))
		);
	}

	/**
	 * Update a file as successfully uploaded in the store
	 */
	function updateFileSuccess(file: File, result: any) {
		displayFiles.update((currentFiles) =>
			currentFiles.map((f) =>
				f.file === file
					? {
							...f,
							url: result.url || null,
							filePath: result.filePath || null,
							fileId: result.fileId,
							uploading: false,
							error: false
						}
					: f
			)
		);
	}

	/**
	 * Update a file as having an error in the store
	 */
	function updateFileError(file: File) {
		displayFiles.update((currentFiles) =>
			currentFiles.map((f) => (f.file === file ? { ...f, uploading: false, error: true } : f))
		);
	}

	/**
	 * Add files to the upload queue and start uploading
	 * Enhanced with toast notifications and better error handling
	 */ function addFiles(newFiles: File[]) {
		if (!browser) {
			return;
		}

		if (newFiles.length > 0) {
			let succeeded = 0;
			let failed = 0;

			newFiles.forEach((file) => {
				displayFiles.update((currentFiles) => [
					...currentFiles,
					{ file, url: null, uploading: true, progress: 0, error: false, filePath: null }
				]);

				uploadFile(file, (progress) => updateFileProgress(file, progress))
					.then((result: any) => {
						if (result && result.success) {
							updateFileSuccess(file, result);
							succeeded++;
						} else {
							updateFileError(file);
							failed++;
							// Show specific error for this file
							if (result && result.error) {
								$flash = { type: 'error', message: 'Neizdevās augšuplādēt' };
							}
						}

						// Update the main toast when all files are processed
						if (succeeded + failed === newFiles.length) {
							if (failed === 0) {
								$flash = { type: 'success', message: 'Veiksmīgi augšuplādēts' };
							} else if (succeeded === 0) {
								$flash = { type: 'error', message: 'Neizdevās augšuplādēt' };
							} else {
								$flash = {
									type: 'warning',
									message: `${succeeded} faili augšuplādēti, ${failed} neizdevās`
								};
							}
						}
					})
					.catch((error) => {
						updateFileError(file);
						failed++;

						// Show specific error for this file
						toast.error(`Error uploading ${file.name}`);

						// Update the main toast when all files are processed
						if (succeeded + failed === newFiles.length) {
							if (succeeded === 0) {
								$flash = { type: 'error', message: 'Neizdevās augšuplādēt' };
							} else {
								$flash = {
									type: 'warning',
									message: `${succeeded} faili augšuplādēti, ${failed} neizdevās`
								};
							}
						}
					});
			});
		}
	}

	/**
	 * Retry uploading a failed file
	 * Enhanced with toast notifications for better user feedback
	 */
	async function retryUpload(file: File) {
		// Show retry in progress
		const toastId = toast.loading(`Retrying upload for ${file.name}...`);

		displayFiles.update((currentFiles) =>
			currentFiles.map((f) =>
				f.file === file ? { ...f, uploading: true, error: false, progress: 0, filePath: null } : f
			)
		);

		uploadFile(file, (progress) => updateFileProgress(file, progress))
			.then((result: any) => {
				if (result && result.success) {
					updateFileSuccess(file, result);
					toast.success(`Successfully uploaded ${file.name}`, { id: toastId });
				} else {
					updateFileError(file);
					toast.error(`Failed to upload ${file.name}${result.error ? `: ${result.error}` : ''}`, {
						id: toastId
					});
				}
			})
			.catch((error) => {
				updateFileError(file);
				toast.error(`Error uploading ${file.name}`, { id: toastId });
				console.error('Upload retry error:', error);
			});
	}

	/**
	 * Remove a file from the store and delete it from the server if it was uploaded
	 * Enhanced with more comprehensive error handling and user feedback
	 */
	async function removeUploadedFile(index: number) {
		const fileToDelete = get(displayFiles)[index];
		let success = true;

		// Only try to delete from server if we have a file path or ID
		if (fileToDelete.fileId || fileToDelete.filePath) {
			try {
				const response = await fetch('/api/taskfiles', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						filePath: fileToDelete.filePath,
						fileId: fileToDelete.fileId
					})
				});

				if (!response.ok) {
					const errorData = await response.json();
					console.error('Failed to delete file:', errorData);
					// Still continuing with UI removal but marking the operation as unsuccessful
					success = false;

					// You could add a toast notification here:
					// toast.error('Failed to delete file from server')
				}

				// Always remove from UI regardless of server success
				displayFiles.update((currentFiles) => currentFiles.filter((_, i) => i !== index));
			} catch (error) {
				console.error('Error deleting file:', error);
				// Remove from store even if there's an error with the server
				displayFiles.update((currentFiles) => currentFiles.filter((_, i) => i !== index));
			}
		} else {
			// No server-side file to delete, just remove from the store
			displayFiles.update((currentFiles) => currentFiles.filter((_, i) => i !== index));
		}

		// Clean up any blobs or object URLs to prevent memory leaks
		if (fileToDelete.url && fileToDelete.url.startsWith('blob:')) {
			try {
				URL.revokeObjectURL(fileToDelete.url);
			} catch (e) {
				console.error('Error revoking object URL:', e);
			}
		}
	}
	/**
	 * Remove an existing file from the database
	 */
	async function removeExistingFile(index: number) {
		const fileToDelete = get(dbFiles)[index];

		try {
			// Show deletion in progress
			const toastId = toast.loading(`Removing ${fileToDelete.filename}...`);

			const response = await fetch('/api/taskfiles', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					fileId: fileToDelete.id
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Failed to delete existing file:', errorData);
				toast.error('Failed to delete file', { id: toastId });
			} else {
				toast.success('File removed successfully', { id: toastId });
			} // Always remove from UI regardless of server success
			dbFiles.update((currentFiles) => currentFiles.filter((_: any, i: number) => i !== index));
		} catch (error) {
			console.error('Error deleting existing file:', error);
			toast.error('Error removing file'); // Remove from store even if there's an error with the server
			dbFiles.update((currentFiles) => currentFiles.filter((_: any, i: number) => i !== index));
		}
	}

	/**
	 * Download an existing file
	 * Enhanced with more robust error handling and support for direct file access
	 */
	async function downloadFile(file: { downloadUrl: string; filename: string }) {
		try {
			// Check if the URL is relative (starts with /) or absolute
			const url = file.downloadUrl.startsWith('/')
				? file.downloadUrl
				: `/${file.downloadUrl.replace(/^https?:\/\/[^/]+\//, '')}`;

			// Create a temporary link element
			const link = document.createElement('a');
			link.href = url;
			link.download = file.filename; // Set the download attribute to suggest filename
			link.target = '_blank'; // Open in new tab if download attribute is not supported

			// Append to the document, click it, then remove it
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Return success - this allows us to provide feedback to the user if needed
			return true;
		} catch (error) {
			console.error('Error downloading file:', error);
			// Could add toast notification here with toast.error('File download failed')
			return false;
		}
	}
</script>

<div
	class="mb-3 block w-full cursor-pointer rounded-lg border-2 border-dashed {dragActive
		? 'border-violet-500 bg-violet-950/20'
		: 'border-neutral-600 bg-zinc-950'} px-4 py-3 text-center text-sm transition-colors duration-200"
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	ondrop={onDrop}
	onclick={triggerFileInput}
	onkeydown={onKeydown}
	tabindex="0"
	role="button"
	aria-label="Upload files by clicking or dragging them here"
>
	<p class="text-sm {dragActive ? 'text-violet-300' : 'text-neutral-500'}">
		Darba failus var iemest vai izvēlēties šeit.
	</p>
	<!-- Hidden file IDs input for form submission -->
	{#if formData}
		<!-- If using SuperForms, bind directly to the form data -->
		{#each $formData.files || [] as fileId}
			<input type="hidden" name="files" value={fileId} />
		{/each}
	{:else}
		<!-- Traditional form submission - not used in this case -->
		<!-- This is just a fallback if no SuperForm is provided -->
	{/if}
	<input
		type="file"
		multiple
		class="hidden"
		onchange={onFileChange}
		bind:this={fileInput}
		aria-hidden="true"
	/>
</div>

<div class="mb-3 flex flex-wrap gap-2" aria-label="Uploaded files list">
	{#if $dbFiles.length === 0 && $displayFiles.length === 0}
		<div class="w-full py-1 text-center text-xs text-neutral-500 italic">Nav pievienotu failu</div>
	{/if}

	<!-- Previously uploaded files from the database -->
	{#each $dbFiles as dbFile, index}
		<div
			class="flex items-center gap-2 rounded bg-gray-100 px-2 py-1 text-xs dark:bg-zinc-900"
			role="group"
			aria-label="File: {dbFile.filename}"
		>
			<div class="max-w-28 truncate" title={`${dbFile.filename} (${formatFileSize(dbFile.size)})`}>
				{dbFile.filename.length > 15 ? `${dbFile.filename.slice(0, 12)}...` : dbFile.filename}
				<span class="ml-1 text-xs text-gray-500">
					({formatFileSize(dbFile.size)})
				</span>
			</div>
			<button
				type="button"
				class="text-sm text-blue-500 hover:text-blue-700"
				onclick={() => downloadFile(dbFile)}
				aria-label="Download file: {dbFile.filename}"
				title="Download file"
			>
				<DownloadIcon size={14} />
			</button>
			<button
				type="button"
				class="text-sm text-red-500 hover:text-red-700"
				onclick={() => removeExistingFile(index)}
				aria-label="Delete file: {dbFile.filename}"
				title="Remove file"
			>
				close
			</button>
		</div>
	{/each}

	<!-- Newly uploaded files -->
	{#each $displayFiles as { file, url, uploading, progress, error, fileId }, index}
		<div
			class="flex items-center gap-2 rounded bg-gray-100 px-2 py-1 text-xs dark:bg-zinc-900"
			role="group"
			aria-label="File: {file.name}"
		>
			<div class="max-w-28 truncate" title={`${file.name} (${formatFileSize(file.size)})`}>
				{file.name.length > 15 ? `${file.name.slice(0, 12)}...` : file.name}
				<span class="ml-1 text-xs text-gray-500">
					({formatFileSize(file.size)})
				</span>
			</div>
			{#if uploading}
				<div class="h-2 w-24 overflow-hidden rounded bg-neutral-200">
					<div class="h-full bg-violet-500" style="width: {progress}%"></div>
				</div>
			{/if}
			{#if error}
				<button
					onclick={() => retryUpload(file)}
					class="text-xs text-red-500 hover:text-red-700"
					title="Retry upload"
				>
					Retry
				</button>
			{/if}
			{#if url && !uploading && !error}
				<button
					type="button"
					class="text-sm text-blue-500 hover:text-blue-700"
					onclick={() => downloadFile({ downloadUrl: url, filename: file.name })}
					aria-label="Download file: {file.name}"
					title="Download file"
				>
					<DownloadIcon size={14} />
				</button>
			{/if}
			<button
				type="button"
				class="text-sm text-red-500 hover:text-red-700"
				onclick={() => removeUploadedFile(index)}
				aria-label="Delete file: {file.name}"
				title="Remove file"
			>
				close
			</button>
		</div>
	{/each}
</div>
