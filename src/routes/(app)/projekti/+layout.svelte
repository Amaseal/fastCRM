<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/state';
	import List from '$lib/components/list.svelte';
	import { horizontalDragScroll } from '$lib/horizontalScroll';
	import { disableScroll } from '$lib/stores';
	import { Input } from '$lib/components/ui/input/index.js';
	import { debounce } from '$lib/utils';
	import Plus from '@lucide/svelte/icons/plus';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		DndContext,
		DragOverlay,
		type DragEndEvent,
		type DragOverEvent,
		type DragStartEvent
	} from '@dnd-kit-svelte/core';
	import { SortableContext, arrayMove } from '@dnd-kit-svelte/sortable';
	import ProjectCard from '$lib/components/project-card.svelte';
	let { data, children } = $props();
	let tabs = $state(data.tabs);

	$effect(() => {
		tabs = data.tabs;
	});

	let searchTerm = $state(page.url.searchParams.get('search') || '');
	let activeItem = $state<any>(null);
	let activeType = $state<'tab' | 'task' | null>(null);

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
	}
	function findTabContainingTask(taskId: string) {
		return tabs.find((tab) => tab.tasks?.some((task) => task.id === Number(taskId)));
	}
	function handleDragStart({ active }: DragStartEvent) {
		activeType = active.data?.type as 'tab' | 'task';

		if (activeType === 'tab') {
			activeItem = tabs.find((tab) => tab.id === Number(active.id));
		} else if (activeType === 'task') {
			const containingTab = findTabContainingTask(active.id as string);
			activeItem = containingTab?.tasks?.find((task) => task.id === Number(active.id));
		}

		// Immediately disable scroll and keep it disabled for the entire drag operation
		$disableScroll = true;
	}
	async function handleDragEnd({ active, over }: DragEndEvent) {
		activeItem = null;
		activeType = null;
		if (!over) {
			// For cancelled drags, re-enable scroll immediately
			$disableScroll = false;
			return;
		}

		const activeId = active.id as string;
		const overId = over.id as string;
		const activeDataType = active.data?.type as 'tab' | 'task';
		const overDataType = over.data?.type as 'tab' | 'task' | 'tab-content';
		if (activeDataType === 'tab' && (overDataType === 'tab' || overDataType === 'tab-content')) {
			// Handle tab reordering
			const oldIndex = tabs.findIndex((tab) => tab.id === Number(activeId));
			const newIndex = tabs.findIndex((tab) => tab.id === Number(overId));
			if (oldIndex !== newIndex) {
				// Optimistically update the UI first for immediate feedback
				// Create a new array instead of using arrayMove to avoid state proxy issues
				const newTabs = [...tabs];
				const [movedTab] = newTabs.splice(oldIndex, 1);
				newTabs.splice(newIndex, 0, movedTab);
				tabs = newTabs;

				const formData = new FormData();
				formData.append('draggedTab', JSON.stringify(tabs[newIndex]));
				formData.append('targetIndex', newIndex.toString());

				try {
					const response = await fetch('?/reorderTabs', {
						method: 'POST',
						body: formData,
						headers: {
							'x-sveltekit-action': 'true'
						}
					});
					if (response.ok) {
						// Invalidate to sync with server data - this is crucial for tab reordering
						await invalidateAll();
					} else {
						// Revert the optimistic update if server request failed
						const revertTabs = [...tabs];
						const [movedTab] = revertTabs.splice(newIndex, 1);
						revertTabs.splice(oldIndex, 0, movedTab);
						tabs = revertTabs;
					}
				} catch (error) {
					console.error('Tab reorder failed:', error);
					// Revert the optimistic update
					const revertTabs = [...tabs];
					const [movedTab] = revertTabs.splice(newIndex, 1);
					revertTabs.splice(oldIndex, 0, movedTab);
					tabs = revertTabs;
				} finally {
					// Re-enable scroll immediately - horizontal scroll will ignore events for a grace period
					$disableScroll = false;
				}
			} else {
				// No reordering needed, re-enable scroll immediately
				$disableScroll = false;
			}
		} else if (activeDataType === 'task' && overDataType === 'tab-content') {
			// Handle task movement between tabs
			const sourceTab = findTabContainingTask(activeId);
			const targetTabId = Number(overId);
			if (sourceTab && sourceTab.id !== targetTabId) {
				const task = sourceTab.tasks?.find((t) => t.id === Number(activeId));

				if (task) {
					// Optimistically update the UI first
					sourceTab.tasks = (sourceTab.tasks || []).filter((t) => t.id !== task.id);
					const targetTab = tabs.find((t) => t.id === targetTabId);
					if (targetTab) {
						targetTab.tasks = [...(targetTab.tasks || []), task];
					}
					tabs = [...tabs]; // Trigger reactivity

					const formData = new FormData();
					formData.append('draggedItem', JSON.stringify(task));
					formData.append('sourceContainer', sourceTab.id.toString());
					formData.append('targetContainer', targetTabId.toString());

					try {
						const response = await fetch('?/editCategory', {
							method: 'POST',
							body: formData,
							headers: {
								'x-sveltekit-action': 'true'
							}
						});
						if (!response.ok) {
							// Revert the optimistic update if server request failed
							if (targetTab) {
								targetTab.tasks = (targetTab.tasks || []).filter((t) => t.id !== task.id);
							}
							sourceTab.tasks = [...(sourceTab.tasks || []), task];
							tabs = [...tabs];
						}
					} catch (error) {
						console.error('Task move failed:', error); // Revert the optimistic update
						if (targetTab) {
							targetTab.tasks = (targetTab.tasks || []).filter((t) => t.id !== task.id);
						}
						sourceTab.tasks = [...(sourceTab.tasks || []), task];
						tabs = [...tabs];
					} finally {
						// Re-enable scroll immediately - horizontal scroll will ignore events for a grace period
						$disableScroll = false;
					}
				} else {
					// No task found or other issue, re-enable scroll immediately
					$disableScroll = false;
				}
			} else {
				// No movement needed (same tab or other reason), re-enable scroll immediately
				$disableScroll = false;
			}
		} else {
			// No valid drop operation, re-enable scroll immediately
			$disableScroll = false;
		}
	}
	function handleDragOver({ active, over }: DragOverEvent) {
		// Only provide visual feedback during drag over, don't modify data
		// Data will be modified only on successful drop in handleDragEnd
	}
	function handleDragCancel() {
		activeItem = null;
		activeType = null;

		// For cancelled drags, re-enable scroll immediately
		$disableScroll = false;
	}
</script>

<svelte:head>
	<title>Projekti</title>
</svelte:head>

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

<DndContext
	onDragStart={handleDragStart}
	onDragEnd={handleDragEnd}
	onDragOver={handleDragOver}
	onDragCancel={handleDragCancel}
>
	<SortableContext items={tabs.map((tab) => tab.id.toString())}>
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
			{#each tabs as tab (tab.id)}
				<List {tab} />
			{/each}
		</div>
	</SortableContext>

	<DragOverlay>
		{#if activeType === 'task' && activeItem}
			<ProjectCard task={activeItem} container={''} isDragOverlay={true} />
		{:else if activeType === 'tab' && activeItem}
			<List tab={activeItem} isDragOverlay={true} />
		{/if}
	</DragOverlay>
</DndContext>
