<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronsLeft from '@lucide/svelte/icons/chevrons-left';
	import ChevronsRight from '@lucide/svelte/icons/chevrons-right';
	import Download from '@lucide/svelte/icons/download';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { debounce } from '$lib/utils';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { formatDate } from '$lib/utils';
	import type { File } from '$lib/server/db/schema.js';
	import { type FileSchema } from './shema';
	import { type SuperValidated, type Infer } from 'sveltekit-superforms';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Plus } from '@lucide/svelte';

	let {
		data,
		children
	}: {
		data: {
			form: SuperValidated<Infer<FileSchema>>;
			files: (File & { task?: { id: number; title: string } | null })[];
			pagination: {
				page: number;
				pageSize: number;
				totalCount: number;
				totalPages: number;
				search: string;
				sortColumn: string;
				sortDirection: string;
			};
		};
		children?: () => any;
	} = $props();

	// Initialize state from server data
	let currentPage = $state(data.pagination.page);
	let pageSize = $state(data.pagination.pageSize);
	let pageSizeOptions = [5, 10, 25, 50, 100];
	let sortColumn = $state(data.pagination.sortColumn as keyof File | null);
	let sortDirection = $state(data.pagination.sortDirection as 'asc' | 'desc');
	let searchTerm = $state(data.pagination.search);

	// Debounced search function
	const debouncedSearch = debounce((term: string) => {
		const url = new URL(window.location.href);
		if (term) {
			url.searchParams.set('search', term);
		} else {
			url.searchParams.delete('search');
		}
		url.searchParams.set('page', '0'); // Reset to first page on search
		goto(url.toString());
	}, 1200);

	// Handle search input
	const handleSearch = (event: Event) => {
		const target = event.target as HTMLInputElement;
		searchTerm = target.value;
		debouncedSearch(searchTerm);
	};

	// Handle sorting
	const handleSort = (column: keyof File) => {
		const url = new URL(window.location.href);

		if (sortColumn === column) {
			// Toggle direction if same column
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			// New column, default to ascending
			sortColumn = column;
			sortDirection = 'asc';
		}

		url.searchParams.set('sortColumn', String(column));
		url.searchParams.set('sortDirection', sortDirection);
		goto(url.toString());
	};

	// Handle pagination
	const goToPage = (newPage: number) => {
		const url = new URL(window.location.href);
		url.searchParams.set('page', String(newPage));
		goto(url.toString());
	};
	const handlePageSizeChange = (event: Event) => {
		const target = event.target as HTMLSelectElement;
		const newPageSize = parseInt(target.value);
		const url = new URL(window.location.href);
		url.searchParams.set('pageSize', String(newPageSize));
		url.searchParams.set('page', '0'); // Reset to first page
		goto(url.toString());
	};

	// Additional pagination functions
	const goToFirstPage = () => goToPage(0);
	const goToLastPage = () => goToPage(data.pagination.totalPages - 1);

	// Get visible page numbers for pagination
	const getVisiblePageNumbers = (): number[] => {
		const totalPages = data.pagination.totalPages;
		const current = currentPage;
		const maxVisible = 5;

		if (totalPages <= maxVisible) {
			return Array.from({ length: totalPages }, (_, i) => i);
		}

		const pages: number[] = [];
		const half = Math.floor(maxVisible / 2);
		let start = Math.max(0, current - half);
		let end = Math.min(totalPages - 1, start + maxVisible - 1);

		// Adjust start if we're near the end
		if (end - start < maxVisible - 1) {
			start = Math.max(0, end - maxVisible + 1);
		}

		// Add first page and ellipsis if needed
		if (start > 0) {
			pages.push(0);
			if (start > 1) {
				pages.push(-1); // -1 represents ellipsis
			}
		}

		// Add visible pages
		for (let i = start; i <= end; i++) {
			if (i !== 0 || start === 0) {
				pages.push(i);
			}
		}

		// Add ellipsis and last page if needed
		if (end < totalPages - 1) {
			if (end < totalPages - 2) {
				pages.push(-1); // -1 represents ellipsis
			}
			pages.push(totalPages - 1);
		}

		return pages;
	};

	// Format file size
	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	// Handle file download
	const downloadFile = (file: File) => {
		const link = document.createElement('a');
		link.href = file.downloadUrl;
		link.download = file.filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};
</script>

<svelte:head>
	<title>Faili</title>
</svelte:head>

{@render children?.()}
<header
	class="bg-background flex h-(--header-height) shrink-0 items-center gap-2 rounded-lg border-b px-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 lg:gap-2">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">Faili</h1>
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<Input
			type="text"
			class="w-full max-w-sm"
			placeholder="Meklēt failus..."
			value={searchTerm}
			oninput={handleSearch}
		/>
	</div>
</header>

<div class="mb-4 space-y-4">
	<div class="bg-background rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-[150px] md:w-[300px]">
						<Button
							variant="ghost"
							onclick={() => handleSort('filename')}
							class="h-auto p-0 font-semibold"
						>
							Faila nosaukums
							{#if sortColumn === 'filename'}
								{#if sortDirection === 'asc'}
									<ChevronUp class="ml-2 h-4 w-4" />
								{:else}
									<ChevronDown class="ml-2 h-4 w-4" />
								{/if}
							{/if}
						</Button>
					</Table.Head>
					<Table.Head class="hidden md:table-cell">
						<Button
							variant="ghost"
							onclick={() => handleSort('size')}
							class="h-auto p-0 font-semibold"
						>
							Izmērs
							{#if sortColumn === 'size'}
								{#if sortDirection === 'asc'}
									<ChevronUp class="ml-2 h-4 w-4" />
								{:else}
									<ChevronDown class="ml-2 h-4 w-4" />
								{/if}
							{/if}
						</Button>
					</Table.Head>
					<Table.Head class="hidden md:table-cell">Projekts</Table.Head>
					<Table.Head class="hidden md:table-cell">
						<Button
							variant="ghost"
							onclick={() => handleSort('created_at')}
							class="h-auto p-0 font-semibold"
						>
							Pievienots
							{#if sortColumn === 'created_at'}
								{#if sortDirection === 'asc'}
									<ChevronUp class="ml-2 h-4 w-4" />
								{:else}
									<ChevronDown class="ml-2 h-4 w-4" />
								{/if}
							{/if}
						</Button>
					</Table.Head>
					<Table.Head class="text-right">Darbības</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.files as file (file.id)}
					<Table.Row>
						<Table.Cell class="font-medium">{file.filename}</Table.Cell>
						<Table.Cell class="hidden md:table-cell">{formatFileSize(file.size)}</Table.Cell>
						<Table.Cell class="hidden md:table-cell">
							{#if file.task}
								<a
									href="/projekti/labot/{file.task.id}"
									class="text-blue-600 underline hover:text-blue-800"
								>
									{file.task.title}
								</a>
							{:else}
								<span class="text-muted-foreground">Nav piesaistīts</span>
							{/if}
						</Table.Cell>
						<Table.Cell class="hidden md:table-cell">{formatDate(file.created_at)}</Table.Cell>
						<Table.Cell class="text-right">
							<div class="flex items-center justify-end gap-2">
								<Button variant="outline" size="sm" onclick={() => downloadFile(file)}>
									<Download class="h-4 w-4" />
								</Button>
								<Button variant="outline" size="sm" href="/faili/izdzest/{file.id}">
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={5} class="text-center text-muted-foreground">
							Nav atrasti faili
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<!-- Enhanced Pagination Controls -->
	<div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
		<div class="text-muted-foreground text-sm">
			Rāda {currentPage * pageSize + 1}-{Math.min(
				(currentPage + 1) * pageSize,
				data.pagination.totalCount
			)} no {data.pagination.totalCount} ierakstiem
		</div>

		<div class="flex flex-col items-center gap-2 md:flex-row">
			<div class="flex items-center space-x-2">
				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8"
					disabled={currentPage === 0}
					onclick={goToFirstPage}
					aria-label="Pirmā lapa"
				>
					<ChevronsLeft class="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8"
					disabled={currentPage === 0}
					onclick={() => goToPage(currentPage - 1)}
					aria-label="Iepriekšējā lapa"
				>
					<ChevronLeft class="h-4 w-4" />
				</Button>

				{#each getVisiblePageNumbers() as pageNum}
					{#if pageNum >= 0}
						<Button
							variant={pageNum === currentPage ? 'default' : 'outline'}
							size="icon"
							class="h-8 w-8"
							onclick={() => goToPage(pageNum)}
						>
							{pageNum + 1}
						</Button>
					{:else}
						<Button variant="outline" size="icon" class="h-8 w-8" disabled>...</Button>
					{/if}
				{/each}

				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8"
					disabled={currentPage >= data.pagination.totalPages - 1 ||
						data.pagination.totalPages === 0}
					onclick={() => goToPage(currentPage + 1)}
					aria-label="Nākamā lapa"
				>
					<ChevronRight class="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8"
					disabled={currentPage >= data.pagination.totalPages - 1 ||
						data.pagination.totalPages === 0}
					onclick={goToLastPage}
					aria-label="Pēdējā lapa"
				>
					<ChevronsRight class="h-4 w-4" />
				</Button>
			</div>

			<div class="flex items-center gap-2">
				<span class="text-muted-foreground text-sm">Ieraksti lapā</span>
				<select
					class="border-input bg-background h-8 rounded-md border px-2 py-1 text-sm"
					value={pageSize}
					onchange={handlePageSizeChange}
				>
					{#each pageSizeOptions as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
</div>
