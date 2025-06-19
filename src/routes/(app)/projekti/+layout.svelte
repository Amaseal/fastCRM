<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import { page } from '$app/state';
	import List from '$lib/components/list.svelte';
	import { horizontalDragScroll } from '$lib/horizontalScroll';
	import { disableScroll } from '$lib/stores';
	import { Input } from '$lib/components/ui/input/index.js';
	import { dndzone, dragHandleZone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import Plus from '@lucide/svelte/icons/plus';
	import Search from '@lucide/svelte/icons/search';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ProjectCard from '$lib/components/project-card.svelte';
	import { getFlash } from 'sveltekit-flash-message';
	import { browser } from '$app/environment';
	let { data, children } = $props();
	let tabs = $state(data.tabs);

	const flash = getFlash(page);
	$effect(() => {
		tabs = data.tabs;
	});
	let searchTerm = $state(page.url.searchParams.get('search') || '');
	let managerFilter = $state(page.url.searchParams.get('manager') || '');
	let lastMovedTabId = $state<number | null>(null);

	// Handle search button click and Enter key
	const handleSearch = () => {
		updateUrlAndNavigate({ search: searchTerm });
	};
	// Handle search input Enter key
	const handleSearchKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			handleSearch();
		}
	};
	// Handle manager filter change
	const handleManagerChange = (value: string | undefined) => {
		managerFilter = value || '';
		updateUrlAndNavigate({ manager: managerFilter });
	};
	// Helper function to create URLs with current search parameters
	const createUrlWithParams = (basePath: string) => {
		if (!browser) return basePath;
		const url = new URL(basePath, window.location.origin);

		// Add current search parameters
		if (searchTerm) {
			url.searchParams.set('search', searchTerm);
		}
		if (managerFilter) {
			url.searchParams.set('manager', managerFilter);
		}

		return url.pathname + url.search;
	};

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
	// svelte-dnd-action handlers for tabs
	function handleTabsSort(e: CustomEvent) {
		const { items, info } = e.detail;

		// Track which tab was moved for the server update
		if (info.trigger === 'droppedIntoZone' && info.id) {
			lastMovedTabId = info.id;
		}

		tabs = items;

		// Send reorder request to server only on finalize
		if (e.type === 'finalize' && lastMovedTabId) {
			updateTabsOrder();
		}
	}
	async function updateTabsOrder() {
		try {
			// Find the moved tab and its new index
			const movedTabIndex = tabs.findIndex((tab) => tab.id === lastMovedTabId);
			if (movedTabIndex === -1) return;

			const movedTab = tabs[movedTabIndex];

			const formData = new FormData();
			formData.append('draggedTab', JSON.stringify(movedTab));
			formData.append('targetIndex', movedTabIndex.toString());

			const response = await fetch('?/reorderTabs', {
				method: 'POST',
				body: formData,
				headers: {
					'x-sveltekit-action': 'true'
				}
			});

			if (response.ok) {
				// Invalidate to refresh flash messages and sync with server
				await invalidateAll();
			} else {
				await invalidateAll(); // Revert to server state
			}
		} catch (error) {
			console.error('Tab reorder failed:', error);
			await invalidateAll(); // Revert to server state
		}
	} // Handle task movement between tabs
	async function handleTaskMove(task: any, sourceTabId: number, targetTabId: number) {
		if (sourceTabId === targetTabId) return;

		const sourceTab = tabs.find((t) => t.id === sourceTabId);
		const targetTab = tabs.find((t) => t.id === targetTabId);

		if (!sourceTab || !targetTab || !task) return;

		try {
			const formData = new FormData();
			formData.append('draggedItem', JSON.stringify(task));
			formData.append('sourceContainer', sourceTabId.toString());
			formData.append('targetContainer', targetTabId.toString());

			const response = await fetch('?/editCategory', {
				method: 'POST',
				body: formData,
				headers: {
					'x-sveltekit-action': 'true'
				}
			});

			// Always invalidate to refresh from server (with flash messages)
			await invalidateAll();
		} catch (error) {
			console.error('Task move failed:', error);
			// Invalidate to refresh from server state
			await invalidateAll();
		}
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

		<!-- Search input with button -->
		<div class="flex items-center gap-2">
			<Input
				type="text"
				class="w-full max-w-sm"
				placeholder="Meklēt projektus..."
				bind:value={searchTerm}
				onkeydown={handleSearchKeydown}
			/>
			<Button onclick={handleSearch} variant="outline" size="sm" class="flex items-center gap-1">
				<Search class="h-4 w-4" />
				Meklēt
			</Button>
		</div>
		<!-- Manager filter -->
		<Select.Root type="single" value={managerFilter} onValueChange={handleManagerChange}>
			<Select.Trigger class="w-[180px]">
				{data.users.find((u) => u.id === managerFilter)?.name ||
					data.users.find((u) => u.id === managerFilter)?.email ||
					'Filtrēt pēc vadītāja'}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="">Visi vadītāji</Select.Item>
				{#each data.users as user}
					<Select.Item value={user.id}>{user.name || user.email}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
		<Button
			href={createUrlWithParams('/projekti/saraksti/pievienot')}
			variant="outline"
			class="ml-auto flex items-center gap-2"
		>
			<Plus />
			Pievienot
		</Button>
	</div>
</header>

<div
	use:horizontalDragScroll={$disableScroll}
	use:dragHandleZone={{
		items: tabs,
		flipDurationMs: 300,
		dropTargetStyle: {
			outline: '1px solid var(--border)'
		},
		type: 'tabs'
	}}
	onconsider={handleTabsSort}
	onfinalize={handleTabsSort}
	class="flex h-[calc(100vh-110px)] gap-4 overflow-x-auto pb-2
					[&::-webkit-scrollbar]:h-2
					[&::-webkit-scrollbar]:w-1
					[&::-webkit-scrollbar-thumb]:rounded-full
					[&::-webkit-scrollbar-thumb]:bg-gray-300
					dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100
					dark:[&::-webkit-scrollbar-track]:bg-zinc-900"
>
	{#each tabs as tab, i (tab.id)}
		<div animate:flip={{ duration: 300 }}>
			<List bind:tab={tabs[i]} {createUrlWithParams} {handleTaskMove} />
		</div>
	{/each}
</div>
