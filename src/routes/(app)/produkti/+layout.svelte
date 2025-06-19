<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table/index.js';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronsLeft from '@lucide/svelte/icons/chevrons-left';
	import ChevronsRight from '@lucide/svelte/icons/chevrons-right';
	import { debounce } from '$lib/utils';
	import { goto } from '$app/navigation';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { formatDate } from '$lib/utils';
	import { page } from '$app/state';
	import type { Product } from '$lib/server/db/schema.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Plus from '@lucide/svelte/icons/plus';

	let {
		data,
		children
	}: {
		data: {
			products: Product[];
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
	let sortColumn = $state(data.pagination.sortColumn as keyof Product | null);
	let sortDirection = $state(data.pagination.sortDirection as 'asc' | 'desc');
	let searchTerm = $state(data.pagination.search);

	// Keep local state in sync with server data
	$effect(() => {
		currentPage = data.pagination.page;
		pageSize = data.pagination.pageSize;
		sortColumn = data.pagination.sortColumn as keyof Product | null;
		sortDirection = data.pagination.sortDirection as 'asc' | 'desc';
		searchTerm = data.pagination.search;
	});

	// Set up debounced search
	const handleSearchInput = (event: Event) => {
		const target = event.target as HTMLInputElement;
		searchTerm = target.value;
		debouncedSearch(target.value);
	};

	const debouncedSearch = debounce((value: string) => {
		updateUrlAndNavigate({ search: value, page: 0 });
	}, 1200);

	// For pagination display
	// Create a function for page numbers
	function getVisiblePageNumbers() {
		const { totalPages } = data.pagination;
		const pages: number[] = [];
		const maxVisiblePages = 5;

		if (totalPages <= maxVisiblePages) {
			// Show all pages if there are few
			for (let i = 0; i < totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Otherwise show a window of pages around current
			const firstPage = 0;
			const lastPage = totalPages - 1;

			// Always include first page
			pages.push(firstPage);

			// Calculate range around current page
			let rangeStart = Math.max(1, currentPage - 1);
			let rangeEnd = Math.min(lastPage - 1, currentPage + 1);

			// Adjust range to always show 3 pages in the middle if possible
			if (currentPage <= 2) {
				rangeEnd = Math.min(lastPage - 1, 3);
			} else if (currentPage >= lastPage - 2) {
				rangeStart = Math.max(1, lastPage - 3);
			}

			// Add ellipsis after first page if needed
			if (rangeStart > 1) {
				pages.push(-1); // -1 represents ellipsis
			}

			// Add pages in range
			for (let i = rangeStart; i <= rangeEnd; i++) {
				pages.push(i);
			}

			// Add ellipsis before last page if needed
			if (rangeEnd < lastPage - 1) {
				pages.push(-2); // -2 represents ellipsis
			}

			// Always include last page
			if (lastPage > 0) {
				pages.push(lastPage);
			}
		}

		return pages;
	}

	// Update URL and navigate to the new page
	function updateUrlAndNavigate(params: Record<string, any>) {
		const url = new URL(page.url);

		// Update the provided parameters
		Object.entries(params).forEach(([key, value]) => {
			if (value !== null && value !== undefined && value !== '') {
				url.searchParams.set(key, value.toString());
			} else {
				url.searchParams.delete(key);
			}
		});

		// Navigate to the new URL
		goto(url.toString(), { replaceState: true });
	}

	// Handle sorting
	function handleSort(column: keyof Product) {
		// Check if the column is sortable
		const sortableColumns: (keyof Product)[] = ['title', 'cost'];
		if (!sortableColumns.includes(column)) return;

		const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';

		updateUrlAndNavigate({
			sortColumn: column,
			sortDirection: newDirection
		});
	}

	// Pagination functions
	function goToPage(page: number) {
		if (page >= 0 && page < data.pagination.totalPages) {
			updateUrlAndNavigate({ page });
		}
	}

	function goToFirstPage() {
		goToPage(0);
	}

	function goToLastPage() {
		goToPage(Math.max(0, data.pagination.totalPages - 1));
	}

	function handlePageSizeChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newPageSize = parseInt(target.value);
		updateUrlAndNavigate({
			pageSize: newPageSize,
			page: 0 // Reset to first page when changing page size
		});
	}
</script>

<svelte:head>
	<title>Produkti</title>
</svelte:head>

{@render children?.()}
<header
	class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 lg:gap-2">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">Produkti</h1>
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<Input
			type="text"
			class="w-full max-w-sm"
			placeholder="Meklēt produktus..."
			value={searchTerm}
			oninput={handleSearchInput}
		/>
		<Button href="/produkti/pievienot" variant="outline" class="ml-auto flex items-center gap-2"
			><Plus />Pievienot</Button
		>
	</div>
</header>
<div class="mb-4 space-y-4">
	<!-- Table -->
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-[150px] cursor-pointer" onclick={() => handleSort('title')}>
						<div class="flex items-center gap-1">
							Nosaukums
							{#if sortColumn === 'title'}
								{#if sortDirection === 'asc'}
									<ChevronUp size="14" />
								{:else}
									<ChevronDown size="14" />
								{/if}
							{:else}
								<ChevronDown size="14" />
							{/if}
						</div>
					</Table.Head>
					<Table.Head>Apraksts</Table.Head>

					<Table.Head
						class="hidden cursor-pointer md:table-cell"
						onclick={() => handleSort('cost')}
					>
						<div class="flex items-center gap-1">
							Pašizmaksa
							{#if sortColumn === 'cost'}
								{#if sortDirection === 'asc'}
									<ChevronUp size="14" />
								{:else}
									<ChevronDown size="14" />
								{/if}
							{:else}
								<ChevronDown size="14" />
							{/if}
						</div>
					</Table.Head>
					<Table.Head>Labots</Table.Head>
					<Table.Head class="w-12 text-right">Rediģēt</Table.Head>
					<Table.Head class="w-12 text-right">Izdzēst</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if data.products.length === 0}
					<Table.Row>
						<Table.Cell colspan={6} class="py-6 text-center"
							>Neviens produkts nav atrasts!</Table.Cell
						>
					</Table.Row>
				{:else}
					{#each data.products as item (item.id)}
						<Table.Row class="hover:bg-muted/50 cursor-pointer">
							<Table.Cell class="font-medium">{item.title || '-'}</Table.Cell>
							<Table.Cell>{item.description || '-'}</Table.Cell>
							<Table.Cell class="hidden md:table-cell">{item.cost} €</Table.Cell>

							<Table.Cell>
								{formatDate(item.updated_at || item.created_at)}
							</Table.Cell>

							<Table.Cell class="text-right">
								<Button href="/produkti/labot/{item.id}" variant="outline"><Pencil /></Button>
							</Table.Cell>
							<Table.Cell class="text-right">
								<Button href="/produkti/izdzest/{item.id}" variant="destructive"><Trash2 /></Button>
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
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

		<div class="flex items-center gap-2">
			<div class="flex items-center space-x-2">
				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8"
					disabled={currentPage === 0}
					onclick={goToFirstPage}
					aria-label="Pirmā lapa"
				>
					<ChevronsLeft className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8"
					disabled={currentPage === 0}
					onclick={() => goToPage(currentPage - 1)}
					aria-label="Iepriekšējā lapa"
				>
					<ChevronLeft className="h-4 w-4" />
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
					<ChevronRight className="h-4 w-4" />
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
					<ChevronsRight className="h-4 w-4" />
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
