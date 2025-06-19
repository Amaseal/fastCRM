<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/sortable';
	import { CSS, styleObjectToString } from '@dnd-kit-svelte/utilities';
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
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { Check, Trash2, MoreVertical } from '@lucide/svelte';
	import { MessageSquare } from '@lucide/svelte';
	import PrintProject from './print-project.svelte';
	import NextcloudShareDialog from './nextcloud-share-dialog-simple.svelte';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/stores';
	import type { TaskWithRelations } from '$lib/types';
	let {
		task,
		container,
		isDragOverlay = false
	}: {
		task: TaskWithRelations;
		container?: any;
		isDragOverlay?: boolean;
	} = $props();
	let showNextcloudDialog = $state(false);
	let actionMenuOpen = $state(false);
	const flash = getFlash(page);

	// Handle successful share to Nextcloud Talk
	function handleShareSuccess(message: string) {
		$flash = { type: 'success', message };
		showNextcloudDialog = false;
	}

	// Handle share error
	function handleShareError(message: string) {
		$flash = { type: 'error', message };
	}
	// Make the task sortable
	const {
		attributes,
		listeners,
		node,
		activatorNode,
		transform,
		transition,
		isDragging,
		isSorting
	} = useSortable({
		id: `task-${task.id}`,
		data: { type: 'task', task }
	});
	const style = $derived(
		styleObjectToString({
			transform: CSS.Transform.toString(transform.current),
			transition: isSorting.current ? transition.current : undefined,
			zIndex: isDragging.current ? 1 : undefined
		})
	);
	let printableRef: HTMLDivElement;
	// Calculate total cost of all products
	function calculateProductsTotal(): number {
		let total = 0;
		(task.taskProducts || []).forEach((taskProduct) => {
			if (taskProduct.product && taskProduct.count && taskProduct.count > 0) {
				total += taskProduct.product.cost * taskProduct.count;
			}
		});
		return total;
	}

	// Calculate remaining price (task price minus products cost)
	let remainingPrice = $derived(() => {
		const taskPrice = task.price || 0;
		const productsTotal = calculateProductsTotal();
		return taskPrice - productsTotal;
	});

	// Format price for display (assuming cost is in cents, convert to euros)
	function formatPrice(priceInCents: number): string {
		return (priceInCents / 100).toFixed(2);
	}

	const printComponent = (): void => {
		if (!printableRef) return;

		const printContents: string = printableRef.innerHTML;

		// Create a hidden iframe for printing
		const iframe = document.createElement('iframe');
		iframe.style.position = 'absolute';
		iframe.style.left = '-9999px';
		iframe.style.top = '-9999px';
		iframe.style.width = '0px';
		iframe.style.height = '0px';
		iframe.style.border = 'none';

		document.body.appendChild(iframe);

		const iframeDoc = iframe.contentWindow?.document;
		if (!iframeDoc) return;

		// Create the print styles
		const styles = `
			body {
				font-family: Arial, sans-serif;
				padding: 1rem;
				margin: 0;
				background: white !important;
				color: black !important;
				line-height: 1.6;
			}
			* {
				color: black !important;
				background-color: transparent !important;
				box-sizing: border-box;
			}
			.print-container {
				font-family: Arial, sans-serif !important;
				color: #000 !important;
				background: #fff !important;
				max-width: none !important;
				width: 100% !important;
			}
			.mx-auto { margin-left: auto; margin-right: auto; }
			.max-w-5xl { max-width: 64rem; }
			.mb-1 { margin-bottom: 0.25rem; }
			.mb-2 { margin-bottom: 0.5rem; }
			.mt-4 { margin-top: 1rem; }
			.pb-2 { padding-bottom: 0.5rem; }
			.pt-2 { padding-top: 0.5rem; }
			.p-3 { padding: 0.75rem; }
			.p-4 { padding: 1rem; }
			.gap-2 { gap: 0.5rem; }
			.space-y-1 > * + * { margin-top: 0.25rem; }
			.border-b-2 { border-bottom-width: 2px; }
			.border-t-2 { border-top-width: 2px; }
			.border-b { border-bottom-width: 1px; }
			.border { border-width: 1px; }
			.border-gray-200 { border-color: #e5e7eb !important; }
			.bg-white { background-color: #ffffff !important; }
			.bg-gray-50 { background-color: #f9fafb !important; }
			.text-2xl { font-size: 1.5rem; line-height: 2rem; }
			.text-base { font-size: 1rem; line-height: 1.5rem; }
			.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
			.font-bold { font-weight: 700; }
			.font-medium { font-weight: 500; }
			.italic { font-style: italic; }
			.text-black { color: #000000 !important; }
			.text-gray-900 { color: #111827 !important; }
			.text-gray-700 { color: #374151 !important; }
			.text-gray-600 { color: #4b5563 !important; }
			.text-gray-800 { color: #1f2937 !important; }
			.text-gray-500 { color: #6b7280 !important; }
			.flex { display: flex; }
			.block { display: block; }
			.grid { display: grid; }
			.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
			.w-1\\/2 { width: 50%; }
			.h-auto { height: auto; }
			.max-w-full { max-width: 100%; }
			.min-h-64 { min-height: 16rem; }
			.justify-between { justify-content: space-between; }
			.rounded-md { border-radius: 0.375rem; }
			.rounded { border-radius: 0.25rem; }
			.last\\:border-b-0:last-child { border-bottom-width: 0; }
			.field-container {
				margin-bottom: 0.75rem !important;
				padding-bottom: 0.375rem !important;
			}
			.field-label {
				margin-bottom: 0.25rem !important;
				font-weight: 600 !important;
				color: #374151 !important;
			}
			.field-value {
				padding-bottom: 0.25rem !important;
				border-bottom: 1px solid #e5e7eb !important;
				margin-bottom: 0.375rem !important;
			}
			@media print {
				body { margin: 0; padding: 1rem; }
				.print-container { padding: 0; }
				.field-container { 
					margin-bottom: 0.5rem !important;
					break-inside: avoid;
				}
			}
			img {
				max-width: 100% !important;
				height: auto !important;
				display: block;
				margin: 0 auto;
			}
		`;

		// Write the content to the iframe
		iframeDoc.open();
		iframeDoc.write(`
			<!DOCTYPE html>
			<html lang="lv">
			<head>
				<title>Projekta Izdruka - ${task.title || 'Projekts'}</title>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<style>${styles}</style>
			</head>
			<body>
				${printContents}
			</body>
			</html>
		`);
		iframeDoc.close();

		// Wait for the iframe to load, then print
		iframe.onload = () => {
			setTimeout(() => {
				iframe.contentWindow?.print();

				// Clean up after printing
				setTimeout(() => {
					document.body.removeChild(iframe);
				}, 1000);
			}, 100);
		};
	};
</script>

<div class="relative mb-2" bind:this={node.current} {style} {...attributes.current}>
	<div class={['', { invisible: isDragging.current && !isDragOverlay }]}>
		<Card.Root class="gap-0 p-1">
			<Card.Header class="flex items-center justify-between p-2">
				<Card.Title class="flex items-center gap-2 text-base">
					{#if task.endDate && task.count && isWorkFeasible(task.endDate, task.count)}
						<TriangleAlert />
					{/if}{task.title}
				</Card.Title>
				<div class="flex items-center gap-2">
					<Card.Description>€{formatPrice(remainingPrice())}</Card.Description>
					<div
						bind:this={activatorNode.current}
						{...listeners.current}
						class="cursor-grab rounded p-2 hover:bg-zinc-100 active:cursor-grabbing dark:hover:bg-zinc-800"
						role="button"
						tabindex="0"
						data-task-drag-handle="true"
					>
						<GripVertical size="16" />
					</div>
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
						{task.endDate ? formatDate(task.endDate) : 'Nav norādīts'}
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
							{task.manager?.name || 'Nav norādīts'}
						</span>
					</p>
					<hr class="my-2 border-gray-300" />
				{/if}
				<div class="flex items-center justify-between">
					<Button
						href={`/projekti/labot/${task.id}`}
						variant="ghost"
						size="sm"
						class="justify-start"
						onclick={() => (actionMenuOpen = false)}
					>
						<Pencil class="mr-2 h-4 w-4" />
						Labot projektu
					</Button>
					<Popover.Root bind:open={actionMenuOpen}>
						<Popover.Trigger
							class="border-input bg-background ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-9 w-9 items-center justify-center rounded-md border px-0 py-0 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
						>
							<MoreVertical class="h-4 w-4" />
							<span class="sr-only">Atvērt darbību izvēlni</span>
						</Popover.Trigger>
						<Popover.Content align="end" class="w-48 p-2">
							<div class="space-y-1">
								<Button
									onclick={() => {
										actionMenuOpen = false;
										printComponent();
									}}
									variant="ghost"
									size="sm"
									class="w-full justify-start"
								>
									<Printer class="mr-2 h-4 w-4" />
									Drukāt projektu
								</Button>

								<Button
									onclick={() => {
										actionMenuOpen = false;
										showNextcloudDialog = true;
									}}
									variant="ghost"
									size="sm"
									class="w-full justify-start"
								>
									<MessageSquare class="mr-2 h-4 w-4" />
									Dalīties Talk
								</Button>

								<Separator class="my-1" />

								<Button
									href={`/projekti/parvietot/${task.id}`}
									variant="ghost"
									size="sm"
									class="w-full justify-start"
									onclick={() => (actionMenuOpen = false)}
								>
									<Check class="mr-2 h-4 w-4" />
									Atzīmēt kā pabeigtu
								</Button>

								<Button
									href={`/projekti/izdzest/${task.id}`}
									variant="ghost"
									size="sm"
									class="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
									onclick={() => (actionMenuOpen = false)}
								>
									<Trash2 class="mr-2 h-4 w-4" />
									Dzēst projektu
								</Button>
							</div>
						</Popover.Content>
					</Popover.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
	<!-- Drag placeholder -->
	{#if isDragging.current && !isDragOverlay}
		<div
			class="absolute inset-0 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-100 dark:bg-zinc-900"
		>
			<span class="text-sm text-zinc-200">Pārvieto: {task.title}</span>
		</div>
	{/if}
</div>

<div bind:this={printableRef} style="display: none;">
	<PrintProject {task} />
</div>

<!-- Nextcloud Share Dialog -->
<NextcloudShareDialog
	taskId={task.id}
	taskTitle={task.title}
	bind:open={showNextcloudDialog}
	onSuccess={handleShareSuccess}
	onError={handleShareError}
/>

<style>
	/* Unused styles removed - they were for date-based styling that's not currently used */
</style>
