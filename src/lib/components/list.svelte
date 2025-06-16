<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { toCurrency } from '$lib/utils';
	import ProjectCard from './project-card.svelte';
	import type { Task } from '$lib/server/db/schema';
	import { Button } from './ui/button';
	import Plus from '@lucide/svelte/icons/plus';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import { disableScroll } from '$lib/stores';
	import { useSortable } from '@dnd-kit-svelte/sortable';
	import { CSS, styleObjectToString } from '@dnd-kit-svelte/utilities';
	import { SortableContext } from '@dnd-kit-svelte/sortable';
	import { useDroppable } from '@dnd-kit-svelte/core';
	let { tab, isDragOverlay = false } = $props();

	// Make the tab sortable (for reordering lists)
	const {
		attributes: tabAttributes,
		listeners: tabListeners,
		node: tabNode,
		activatorNode: tabActivatorNode,
		transform: tabTransform,
		transition: tabTransition,
		isDragging: tabIsDragging,
		isSorting: tabIsSorting
	} = useSortable({
		id: tab?.id?.toString() || 'unknown',
		data: { type: 'tab' }
	});

	// Make the card content area droppable (for accepting tasks)
	const { node: droppableNode, isOver } = useDroppable({
		id: tab?.id?.toString() || 'unknown',
		data: { type: 'tab-content', accepts: ['task'] }
	});
	const tabStyle = $derived(
		styleObjectToString({
			transform: CSS.Transform.toString(tabTransform.current),
			transition: tabIsSorting.current ? tabTransition.current : undefined,
			zIndex: tabIsDragging.current ? 1 : undefined
		})
	);
</script>

<div class="relative h-full" bind:this={tabNode.current} style={tabStyle}>
	<!-- Original element - becomes invisible during drag but maintains dimensions -->
	<div class={['h-full', { invisible: tabIsDragging.current && !isDragOverlay }]}>
		<Card.Root
			class="custom-scroll bg-background relative flex h-full w-[240px] flex-shrink-0 flex-col gap-0 overflow-y-auto p-1"
		>
			<Card.Header class="justify-streatch flex flex-col gap-2 p-1">
				<div class="flex w-full items-center gap-2">
					<Button variant="ghost" href="/projekti/saraksti/labot/{tab?.id || ''}">
						<Card.Title class="text-base">{tab?.title || 'Unknown'}</Card.Title>
					</Button>
					<Card.Description
						>{toCurrency(
							(tab?.tasks || []).reduce((sum: number, task: Task) => sum + (task.price || 0), 0)
						)}
						&#8364</Card.Description
					>
					<div class="ml-auto">
						<div
							bind:this={tabActivatorNode.current}
							{...tabAttributes.current}
							{...tabListeners.current}
						>
							<Button variant="ghost" class="cursor-grab px-2 py-2 active:cursor-grabbing"
								><GripVertical size="16" /></Button
							>
						</div>
					</div>
				</div>
				<hr class=" w-full border-2" style="border-color: {tab?.color || '#ffffff'}" />

				<Button variant="ghost" class="w-full" href="/projekti/pievienot?tabId={tab?.id || ''}"
					><Plus size="14"></Plus></Button
				>
			</Card.Header>
			<Card.Content class="flex h-full flex-col gap-3 p-1">
				<div
					class="h-full transition-colors duration-200 {isOver.current
						? 'bg-zinc-100 dark:bg-zinc-900'
						: ''}"
					bind:this={droppableNode.current}
				>
					<SortableContext items={tab?.tasks?.map((task: Task) => task.id.toString()) || []}>
						{#if !tab?.tasks || tab.tasks.length === 0}
							<div
								class="flex h-full w-full items-center justify-center text-gray-500 dark:text-gray-400"
							>
								No tasks
							</div>
						{:else}
							{#each tab?.tasks || [] as task (task.id)}
								<ProjectCard {task} container={tab?.id?.toString() || ''} />
							{/each}
						{/if}
					</SortableContext>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
	<!-- Drag placeholder -->
	{#if tabIsDragging.current && !isDragOverlay}
		<div
			class="absolute inset-0 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-100 dark:bg-zinc-800"
		>
			<span class="text-zin-200">Pārvieto: {tab?.title || 'Unknown'}</span>
		</div>
	{/if}
</div>
