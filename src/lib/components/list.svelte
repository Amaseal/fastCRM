<script lang="ts">
	let { tab, handleDrop, materials, clients, users } = $props();
	import * as Card from '$lib/components/ui/card/index.js';
	import { droppable } from '@thisux/sveltednd';
	import { toCurrency } from '$lib/utils';

	import ProjectCard from './project-card.svelte';
	import type { Task } from '$lib/server/db/schema';
</script>

<div class="h-full" use:droppable={{ container: tab.id, callbacks: { onDrop: handleDrop } }}>
	<Card.Root
		class="custom-scroll bg-background flex h-full w-[240px] flex-shrink-0 flex-col gap-3 overflow-y-auto p-1"
	>
		<Card.Header class="flex flex-col gap-2 p-1">
			<div class="flex w-full items-center justify-between">
				<Card.Title class=" text-base">{tab.title}</Card.Title>
				<Card.Description
					>{toCurrency(tab.tasks.reduce((sum: number, task: Task) => sum + (task.price || 0), 0))}
					&#8364</Card.Description
				>
			</div>
			<hr class=" w-full border-2" style="border-color: {tab.color}" />

			<!-- <AddTask {materials} {clients} {users} {tab} {products} {taskForm} /> -->
		</Card.Header>
		<Card.Content class="flex h-full flex-col gap-3 p-1">
			{#if tab.tasks.length === 0}
				<div
					class="flex h-full w-full items-center justify-center text-gray-500 dark:text-gray-400"
				>
					No tasks
				</div>
			{:else}
				{#each tab.tasks as task}
					<ProjectCard {task} container={tab.id} {materials} {clients} {users} {tab} />
				{/each}
			{/if}
		</Card.Content>
	</Card.Root>
</div>
