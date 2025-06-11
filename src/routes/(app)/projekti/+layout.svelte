<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/state';
	import List from '$lib/components/list.svelte';
	import { horizontalDragScroll } from '$lib/horizontalScroll';
	import { disableScroll } from '$lib/disableScroll';
	import type { DragDropState } from '@thisux/sveltednd';
	import { Input } from '$lib/components/ui/input/index.js';
	import { debounce } from '$lib/utils';
	import Plus from '@lucide/svelte/icons/plus';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let { data, children } = $props();
	let tabs = $state(data.tabs);

	$effect(() => {
		tabs = data.tabs;
	});

	let searchTerm = $state(page.url.searchParams.get('search') || '');

	// Set up the debounced search function
	const handleSearchInput = (event: Event) => {
		const value = (event.target as HTMLInputElement).value;
		searchTerm = value;
		debouncedSearch(value);
	};
	// Debounce the search to avoid multiple rapid requests
	const debouncedSearch = debounce((value: string) => {
		updateUrlAndNavigate({ search: value });
	}, 500);
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

		// Navigate to the new URL and refocus the input after navigation
		goto(url.toString(), { replaceState: true }).then(() => {
			// Wait a small amount of time for the DOM to update
		});
	} // Check if there are any tasks in any tab

	async function handleDrop(state: DragDropState<{ id: string }>) {
		const { draggedItem, sourceContainer, targetContainer } = state;

		if (!draggedItem?.id || !sourceContainer || !targetContainer) return;
		if (sourceContainer === targetContainer) return;

		const formData = new FormData();
		formData.append('draggedItem', JSON.stringify(draggedItem));
		formData.append('sourceContainer', sourceContainer);
		formData.append('targetContainer', targetContainer);

		const response = await fetch('?/editCategory', {
			method: 'POST',
			body: formData,
			headers: {
				'x-sveltekit-action': 'true'
			}
		});
		invalidateAll();
	}
</script>

<svelte:head>
	<title>Projekti</title>
</svelte:head>

<!-- <DropdownMenu.Root>
		<DropdownMenu.Trigger><EllipsisVertical size={16} /></DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Group>
				<div class="flex flex-col gap-2">
					<TagManager form={data.tagForm} tags={data.tags} />

					<TabManager form={data.tabForm} tabs={data.tabs} tags={data.tags} />
				</div>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root> -->

{@render children?.()}
<header
	class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 lg:gap-2">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">Projekti</h1>
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<Input
			type="text"
			class="w-full max-w-sm"
			placeholder="Meklēt projektus..."
			value={searchTerm}
			oninput={handleSearchInput}
		/>
		<Button
			href="/projekti/saraksti/pievienot"
			variant="outline"
			class="ml-auto flex items-center gap-2"><Plus />Pievienot</Button
		>
	</div>
</header>
<div
	use:horizontalDragScroll={$disableScroll}
	class="flex h-[calc(100vh-110px)] gap-4 overflow-x-auto pb-2
						[&::-webkit-scrollbar]:h-2
						[&::-webkit-scrollbar]:w-1
						[&::-webkit-scrollbar-thumb]:rounded-full
						[&::-webkit-scrollbar-thumb]:bg-gray-300
						dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100
						dark:[&::-webkit-scrollbar-track]:bg-zinc-900"
>
	{#each data.tabs as tab (tab.id)}
		<List {handleDrop} {tab} materials={data.materials} clients={data.clients} users={data.users} />
	{/each}
</div>
