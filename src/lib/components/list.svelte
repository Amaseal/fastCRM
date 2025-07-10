<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { toCurrency } from '$lib/utils';
	import ProjectCard from './project-card.svelte';
	import type { Task } from '$lib/server/db/schema';
	import { Button } from './ui/button';
	import Plus from '@lucide/svelte/icons/plus';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import { disableScroll } from '$lib/stores';
	import { dndzone, dragHandleZone, dragHandle } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import type { TabWithTasks } from '$lib/types';
	let {
		tab = $bindable(),
		createUrlWithParams,
		handleTaskMove
	}: {
		tab: TabWithTasks;
		isDragOverlay?: boolean;
		createUrlWithParams?: (basePath: string) => string;
		handleTaskMove?: (task: any, sourceTabId: number, targetTabId: number) => Promise<void>;
	} = $props();

	// Create tweened store for the total price animation
	const totalPrice = tweened(0, {
		duration: 200, // Animation duration in ms
		easing: cubicOut
	});

	// Custom formatter to show integer values during animation
	const formatAnimatedPrice = (value: number) => {
		return toCurrency(Math.round(value));
	};
	// Update tweened value when tasks change
	$effect(() => {
		const newTotal = (tab?.tasks || []).reduce(
			(sum: number, task: Task) => sum + (task.price || 0),
			0
		);
		totalPrice.set(newTotal);
	});
	// Handle task sorting within the same tab (consider event)
	function handleTasksSort(e: CustomEvent) {
		// Always update items for DOM consistency, but we'll prevent server updates for internal moves
		if (tab) {
			tab.tasks = e.detail.items;
		}
	} // Handle task movement (finalize event)
	function handleTasksDrop(e: CustomEvent) {
		const { items, info } = e.detail;

		if (!tab) return;

		// Always update local state first for DOM consistency
		tab.tasks = items;

		// Only call server for cross-tab movements
		if (info.trigger === 'droppedIntoZone' && handleTaskMove) {
			// Find the task that was dropped from another zone
			const droppedTask = items.find((item: any) => {
				return item.sourceTabId && item.sourceTabId !== tab.id;
			});

			if (droppedTask) {
				// Call the parent handler to move the task on server
				// Pass the actual task object since it might not be in the source tab anymore
				handleTaskMove(droppedTask, droppedTask.sourceTabId, tab.id);
			}
		}
	}
</script>

<Card.Root
	class=" bg-background/70 relative flex h-full w-[260px] flex-shrink-0 flex-col gap-0  p-1"
>
	<Card.Header class="justify-streatch flex flex-col gap-2 p-1">
		<div class="flex w-full items-center gap-2">
			<Button
				variant="ghost"
				href={createUrlWithParams
					? createUrlWithParams(`/projekti/saraksti/labot/${tab?.id || ''}`)
					: `/projekti/saraksti/labot/${tab?.id || ''}`}
			>
				<Card.Title class="text-base">{tab?.title || 'Unknown'}</Card.Title>
			</Button>
			<Card.Description class="font-mono">
				{formatAnimatedPrice($totalPrice)} &#8364
			</Card.Description>
			<div class="ml-auto">
				<div>
					<div
						use:dragHandle
						class="cursor-grab rounded px-2 py-2 hover:bg-zinc-100 active:cursor-grabbing dark:hover:bg-zinc-800"
						role="button"
						tabindex="0"
					>
						<GripVertical size="16" />
					</div>
				</div>
			</div>
		</div>
		<hr class=" w-full border-2" style="border-color: {tab?.color || '#ffffff'}" />
		<Button
			variant="ghost"
			class="w-full"
			href={createUrlWithParams
				? createUrlWithParams(`/projekti/pievienot?tabId=${tab?.id || ''}`)
				: `/projekti/pievienot?tabId=${tab?.id || ''}`}><Plus size="14"></Plus></Button
		>
	</Card.Header>
	<Card.Content class="custom-scroll  h-full  overflow-y-auto p-1">
		<div
			class="flex h-full flex-col gap-3 transition-colors duration-200"
			use:dragHandleZone={{
				items: (tab?.tasks || []).map((task: Task) => ({ ...task, sourceTabId: tab?.id })),
				flipDurationMs: 300,
				dropTargetClasses: ['rounded-xl', 'bg-background/80'],
				dropTargetStyle: {
					outline: 'none'
				},
				morphDisabled: true,
				type: 'tasks'
			}}
			onconsider={handleTasksSort}
			onfinalize={handleTasksDrop}
		>
			{#if !tab?.tasks || tab.tasks.length === 0}
				<div
					class="flex h-full w-full items-center justify-center text-gray-500 dark:text-gray-400"
				>
					Nav projektu
				</div>
			{:else}
				{#each tab?.tasks || [] as task (task.id)}
					<div animate:flip={{ duration: 300 }} class=" active:outline-none">
						<ProjectCard {task} container={tab?.id?.toString() || ''} {createUrlWithParams} />
					</div>
				{/each}
			{/if}
		</div>
	</Card.Content>
</Card.Root>
