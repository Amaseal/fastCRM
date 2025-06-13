<script lang="ts">
	import { draggable, type DragDropState } from '@thisux/sveltednd';
	import { formatDate, toCurrency, getDateDifference, isWorkFeasible } from '$lib/utils';
	import Printer from '@lucide/svelte/icons/printer';
	import User from '@lucide/svelte/icons/user';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Clock from '@lucide/svelte/icons/clock';
	import Hourglass from '@lucide/svelte/icons/hourglass';
	import Handshake from '@lucide/svelte/icons/handshake';
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import { disableScroll } from '$lib/stores';

	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	let { task, container } = $props();

	let printableRef: HTMLDivElement;

	// 	const printComponent = (): void => {
	// 		if (!printableRef) return;

	// 		const printContents: string = printableRef.innerHTML;

	// 		const printWindow = window.open('', '', 'width=800,height=600');
	// 		if (!printWindow) return;

	// 		printWindow.document.write(`
	// 	<html>
	// 	  <head>
	// 		<title>Print View</title>
	// 		<style>
	// 		  body {
	// 			font-family: sans-serif;
	// 			padding: 2rem;
	// 		  }
	// 		</style>
	// 	  </head>
	// 	  <body>
	// 		${printContents}
	// 	  </body>
	// 	</html>
	//   `);
	// 		printWindow.document.close();
	// 		printWindow.focus();
	// 		printWindow.print();
	// 		printWindow.close();
	// 	};

	let editOpen = $state(false);

	function preventParentDrag(event: { stopPropagation: () => void }) {
		// Stop propagation to prevent triggering parent scroll drag
		event.stopPropagation();
	}
</script>

<div
	onpointerdown={preventParentDrag}
	onpointerenter={preventParentDrag}
	onpointerup={preventParentDrag}
	use:draggable={{
		container: container,
		dragData: task,
		interactive: ['.interactive'],
		callbacks: {
			onDragStart: (state: DragDropState) => {
				$disableScroll = true;
			},
			onDragEnd: (state: DragDropState) => {
				$disableScroll = false;
			}
		}
	}}
>
	<Card.Root class="cursor-grab bg-zinc-900 p-1">
		<Card.Header class="flex justify-between p-2">
			<div class="flex items-center justify-between">
				<Card.Title class="flex items-center gap-2 text-base">
					{#if isWorkFeasible(task.endDate, task.count)}
						<TriangleAlert />
					{/if}{task.title}</Card.Title
				>
				<Card.Description>{toCurrency(task.price)} &#8364</Card.Description>
			</div>
		</Card.Header>
		<Card.Content class="p-1">
			{#if task.client}
				<p class="flex items-center gap-1 text-sm text-gray-700 dark:text-neutral-300">
					<Handshake size={16} />
					Klients:
					<span class="font-bold text-black dark:text-white">
						{task.client.name}
					</span>
				</p>

				<hr class="my-2 border-gray-300" />
			{/if}

			<p class="flex items-center gap-1 text-sm text-gray-700 dark:text-neutral-300">
				<CalendarPlus size={16} />
				Izveidots:
				<span class="font-bold text-black dark:text-white">
					{formatDate(task.created_at)}
				</span>
			</p>
			<p class="flex items-center gap-1 text-sm text-gray-700 dark:text-neutral-300">
				<Clock size={16} />
				Jānodod:
				<span class="font-bold text-black dark:text-white">
					{formatDate(task.endDate)}
				</span>
			</p>
			<p class="flex items-center gap-1 text-sm text-gray-700 dark:text-neutral-300">
				<Hourglass size={16} />
				Aktīvs:
				<span class="font-bold text-black dark:text-white"
					>{getDateDifference(task.created_at, new Date())}</span
				>
			</p>

			<hr class="my-2 border-gray-300" />

			{#if task.responsiblePerson}
				<p class="flex items-center gap-1 text-sm text-gray-700 dark:text-neutral-300">
					<User size={16} />
					Atbildīgs:
					<span class="font-bold text-black dark:text-white">
						{task.responsiblePerson.name}
					</span>
				</p>
				<hr class="my-2 border-gray-300" />
			{:else}
				<p class="flex items-center gap-1 text-sm text-gray-700 dark:text-neutral-300">
					<User size={16} />
					Izveidoja:
					<span class="font-bold text-black dark:text-white">
						{task.manager.name}
					</span>
				</p>
				<hr class="my-2 border-gray-300" />
			{/if}
			<div class="flex justify-between gap-2">
				<Button
					onclick={() => (editOpen = true)}
					variant="outline"
					class="interactive flex items-center rounded-lg border p-3 hover:border-purple-500 hover:text-purple-400"
				>
					<Pencil size={16} />
				</Button>

				<!-- <Button
					onclick={printComponent}
					variant="outline"
					class="interactive flex items-center rounded-lg border  p-3  hover:border-purple-500 hover:text-purple-400"
				>
					<Printer size={16} />
				</Button> -->

				<!-- <MoveToDone data={task} />
				<DeleteTask data={task} /> -->
			</div>
		</Card.Content>
	</Card.Root>
</div>

<!-- <div bind:this={printableRef} style="display: none;">
	<Print />
</div> -->

<style>
	.missed {
		border-bottom: 2px solid red;
	}
	.two-days {
		border-bottom: 2px solid orange;
	}
	.tomorrow {
		border-bottom: 2px solid orangered;
	}
</style>
