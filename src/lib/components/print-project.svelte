<script lang="ts">
	import { formatDate, toCurrency } from '$lib/utils';
	import type { TaskWithRelations } from '$lib/types';

	let {
		task
	}: {
		task: TaskWithRelations;
	} = $props();
	// Helper functions
	const getResponsiblePersonName = () => {
		return task.responsiblePerson?.name || 'Nav norādīts';
	};

	const getManagerName = () => {
		return task.manager?.name || 'Nav norādīts';
	};

	const getSelectedMaterials = () => {
		return task.materials || [];
	};

	const getSelectedProducts = () => {
		return task.taskProducts || [];
	};
	// Fix image URL - use relative paths, SvelteKit will handle them correctly
	const getImageUrl = (imagePath: string | null) => {
		if (!imagePath) return null;

		// If it's already a full URL, return as is
		if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
			return imagePath;
		}

		// If it's a relative path starting with /uploads, return as is
		if (imagePath.startsWith('/uploads/')) {
			return imagePath;
		}

		// If it doesn't start with /, add /uploads/ prefix
		if (!imagePath.startsWith('/')) {
			return `/uploads/${imagePath}`;
		}

		return imagePath;
	};

	const seamstresses = [
		{ value: 'Ikšķile', label: 'Ikšķile' },
		{ value: 'Pie mums', label: 'Pie mums' },
		{ value: 'Vladislavs', label: 'Vladislavs' },
		{ value: 'Lielvārde', label: 'Lielvārde' },
		{ value: 'Pagrabs', label: 'Pagrabs' }
	];

	const getSeamstressLabel = () => {
		return (
			seamstresses.find((s) => s.value === task.seamstress)?.label ||
			task.seamstress ||
			'Nav norādīts'
		);
	};
</script>

<!-- Light mode print layout -->
<div class="print-container bg-white p-4 text-black">
	<div class="mx-auto max-w-5xl">
		<!-- Header -->
		<div class="mb-1 border-b-2 border-gray-200 pb-2">
			<h1 class="mb-1 text-2xl font-bold text-gray-900">Projekta Detaļas</h1>
			<div class="text-sm text-gray-600">
				Izveidots: {formatDate(task.created_at)} | ID: {task.id}
			</div>
		</div>

		<!-- Main Content -->
		<div class="flex gap-2">
			<!-- Left Column -->
			<div class="w-1/2 space-y-1">
				<!-- Basic Info -->
				<div class="space-y-1">
					<div class="grid grid-cols-3 gap-1">
						<div class="field-container">
							<div class="field-label mb-2 block text-sm font-medium text-gray-700">Nosaukums</div>
							<div class="field-value border-b border-gray-200 pb-2 text-base text-gray-900">
								{task.title || 'Nav norādīts'}
							</div>
						</div>
						<div class="field-container">
							<div class="field-label mb-2 block text-sm font-medium text-gray-700">Jānodod:</div>
							<div class="field-value border-b border-gray-200 pb-2 text-base text-gray-900">
								{task.endDate ? formatDate(task.endDate) : 'Nav norādīts'}
							</div>
						</div>
						<div class="field-container">
							<div class="field-label mb-2 block text-sm font-medium text-gray-700">Skaits</div>
							<div class="field-value border-b border-gray-200 pb-2 text-base text-gray-900">
								{task.count || '0'}
							</div>
						</div>
					</div>
				</div>
				<!-- Personnel and Details -->
				<div class="space-y-1">
					<div class="grid grid-cols-3 gap-2">
						<div class="field-container">
							<div class="field-label mb-2 block text-sm font-medium text-gray-700">Atbildīgs:</div>
							<div class="field-value border-b border-gray-200 pb-2 text-base text-gray-900">
								{getResponsiblePersonName()}
							</div>
						</div>
						<div class="field-container">
							<div class="field-label mb-2 block text-sm font-medium text-gray-700">Jāšuj:</div>
							<div class="field-value border-b border-gray-200 pb-2 text-base text-gray-900">
								{getSeamstressLabel()}
							</div>
						</div>
						{#if task.client}
							<div class="field-container">
								<div class="field-label mb-2 block text-sm font-medium text-gray-700">Klients</div>
								<div class="field-value border-b border-gray-200 pb-2 text-base text-gray-900">
									{task.client.name}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="grid grid-cols-2 gap-2">
					{#if getSelectedMaterials().length > 0}
						<div class="field-container">
							<div class="field-label mb-2 block text-sm font-medium text-gray-700">Materiāli</div>
							<div class="rounded-md border border-gray-200 bg-gray-50 p-4">
								{#each getSelectedMaterials() as materialRelation}
									<div class="border-b border-gray-200 text-sm text-gray-800 last:border-b-0">
										{materialRelation.material.title}
									</div>
								{/each}
							</div>
						</div>
					{/if}
					{#if getSelectedProducts().length > 0}
						<div class="field-container">
							<div class="field-label mb-2 block text-sm font-medium text-gray-700">Produkti</div>
							<div class="rounded-md border border-gray-200 bg-gray-50 p-4">
								<div class="border-b border-gray-200 text-sm text-gray-800 last:border-b-0">
									{#each getSelectedProducts() as productRelation}
										{productRelation.product.title}
										{#if productRelation.count}
											(Skaits: {productRelation.count})
										{/if}
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
			<!-- Right Column - Description -->
			<div class="w-1/2">
				<div class="field-label mb-1 block text-sm font-medium text-gray-700">Apraksts</div>
				<div class="min-h-64 rounded-md border border-gray-200 bg-gray-50 p-3">
					{#if task.description}
						{@html task.description}
					{:else}
						<div class="text-gray-500 italic">Nav apraksta</div>
					{/if}
				</div>
			</div>
		</div>
		<!-- Preview Image -->
		{#if task.preview}
			<div class="field-container mt-5">
				<div class="field-label mb-2 block text-sm font-medium text-gray-700">Priekšskatījums</div>
				<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
					<img
						src={getImageUrl(task.preview)}
						alt="Projekta priekšskatījums"
						class="h-auto max-w-full rounded"
						onerror={(e) =>
							console.error('Failed to load image:', (e.currentTarget as HTMLImageElement).src)}
					/>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.print-container {
		font-family: 'Arial', sans-serif;
		color: #000 !important;
		background: #fff !important;
	}
	/* Enhanced field spacing - reduced by half */
	.field-container {
		margin-bottom: 0.75rem !important;
		padding-bottom: 0.375rem !important;
	}

	.field-label {
		font-weight: 600 !important;
		color: #374151 !important;
		margin-bottom: 0.25rem !important;
	}

	.field-value {
		padding-bottom: 0.25rem !important;
		margin-bottom: 0.375rem !important;
	}
	/* Print-specific styles */
	@media print {
		.print-container {
			margin: 0;
			padding: 1rem;
			box-shadow: none;
		}

		.field-container {
			break-inside: avoid;
			margin-bottom: 1rem !important;
		}
	}

	/* Override any dark mode styles */
	.print-container * {
		color: inherit !important;
		background-color: transparent !important;
	}

	.print-container .bg-gray-50 {
		background-color: #f9fafb !important;
	}

	.print-container .border-gray-200 {
		border-color: #e5e7eb !important;
	}

	.print-container .text-gray-700 {
		color: #374151 !important;
	}

	.print-container .text-gray-900 {
		color: #111827 !important;
	}

	.print-container .text-gray-600 {
		color: #4b5563 !important;
	}

	.print-container .text-gray-800 {
		color: #1f2937 !important;
	}

	.print-container .text-gray-500 {
		color: #6b7280 !important;
	} /* Enhanced spacing between sections - reduced */
	.space-y-1 > * + * {
		margin-top: 0.25rem;
	}

	/* Better visual hierarchy */
	h1 {
		font-size: 1.875rem !important;
		line-height: 2.25rem !important;
		font-weight: 700 !important;
		margin-bottom: 1rem !important;
	}

	/* Image styling */
	img {
		max-width: 100% !important;
		height: auto !important;
		display: block;
		margin: 0 auto;
	}
</style>
