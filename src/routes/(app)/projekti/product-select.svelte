<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { taskSchema } from './/schema';
	import * as Form from '$lib/components/ui/form/index.js';
	import { z } from 'zod';
	import { CheckIcon, ChevronsUpDownIcon, X } from '@lucide/svelte';
	import NumberInput from '$lib/components/ui/input/number-input.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import * as Command from '$lib/components/ui/command/index.js';
	interface Product {
		id: number;
		title: string;
		description?: string;
		cost: number;
	}

	let {
		products,
		form
	}: {
		products: Product[];
		form: SuperForm<z.infer<typeof taskSchema>>;
		initialProductIds?: number[];
	} = $props(); // Access form data directly
	let formData = form.form;
	// Track which product fields have been touched to avoid showing validation errors prematurely
	let touchedProducts = $state<Set<number>>(new Set()); // Search state for each product selector
	let searchQueries = $state<Record<number, string>>({});

	// Get search query without mutation - safe for template expressions
	function getSearchQuery(index: number): string {
		return searchQueries[index] || '';
	}

	function setSearchQuery(index: number, value: string) {
		searchQueries[index] = value;
		searchQueries = { ...searchQueries };
	}

	// Initialize search queries for all product entries
	$effect(() => {
		if ($formData.taskProducts) {
			$formData.taskProducts.forEach((_, index) => {
				if (!(index in searchQueries)) {
					searchQueries[index] = '';
				}
			});
		}
	});

	// Fuzzy search function that handles diacritics and case insensitivity
	function normalizeText(text: string): string {
		return text
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '') // Remove diacritics
			.replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
			.trim();
	}

	function fuzzyMatch(searchTerm: string, targetText: string): boolean {
		if (!searchTerm) return true;

		const normalizedSearch = normalizeText(searchTerm);
		const normalizedTarget = normalizeText(targetText);

		// Simple fuzzy matching - check if all characters from search appear in order
		let searchIndex = 0;
		for (let i = 0; i < normalizedTarget.length && searchIndex < normalizedSearch.length; i++) {
			if (normalizedTarget[i] === normalizedSearch[searchIndex]) {
				searchIndex++;
			}
		}

		return searchIndex === normalizedSearch.length;
	}

	// Filter options based on search query
	function getFilteredOptions(searchQuery: string) {
		if (!searchQuery) return options;

		return options.filter(
			(option) =>
				fuzzyMatch(searchQuery, option.label) || fuzzyMatch(searchQuery, option.description || '')
		);
	} // Ensure there's at least one product entry
	$effect(() => {
		if (!$formData.taskProducts || $formData.taskProducts.length === 0) {
			$formData.taskProducts = [{ productId: 0, count: 1 }];
		}
	}); // Add a new product entry
	function addEntry() {
		if (!$formData.taskProducts) $formData.taskProducts = [];
		$formData.taskProducts = [...$formData.taskProducts, { productId: 0, count: 1 }];
	}
	// Remove a product entry
	function removeEntry(index: number) {
		if ($formData.taskProducts) {
			$formData.taskProducts = $formData.taskProducts.filter((_, i) => i !== index);
		}
	}
	const options = products.map(({ id, title, description }: Product) => ({
		value: id,
		label: title,
		description: description || ''
	})); // Calculate total price based on selected products and counts
	function calculateTotalPrice(): number {
		let total = 0;
		($formData.taskProducts || []).forEach((entry) => {
			const product = products.find((p) => p.id === entry.productId);
			if (product && entry.count > 0 && entry.productId > 0) {
				total += product.cost * entry.count;
			}
		});
		return total;
	}

	// Format price for display (assuming cost is in cents, convert to euros)
	function formatPrice(priceInCents: number): string {
		return (priceInCents / 100).toFixed(2);
	}
	// Reactive total price calculation
	let totalPrice = $derived(calculateTotalPrice());

	$inspect(() => {
		$formData.taskProducts;
	});
</script>

<div class="space-y-3">
	<Form.Fieldset {form} name="taskProducts" class="w-full">
		{#each $formData.taskProducts || [] as entry, index}
			<div class="flex items-end justify-stretch gap-2">
				<Form.Field {form} name={`taskProducts[${index}].productId`} class="flex-1">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Produkti</Form.Label>
							<Popover.Root>
								<Popover.Trigger
									class={cn(
										buttonVariants({ variant: 'outline' }),
										'w-full justify-between text-left',
										(!entry.productId || entry.productId === 0) && 'text-muted-foreground'
									)}
									role="combobox"
									onclick={() => {
										touchedProducts.add(index);
										touchedProducts = new Set(touchedProducts);
									}}
								>
									<div class="flex items-center gap-2 text-left">
										{#if entry.productId === 0}
											<span>Izvēlies produktu</span>
										{:else}
											{@const selectedOption = options.find((f) => f.value === entry.productId)}
											<span class="font-medium">{selectedOption?.label || 'Izvēlies produktu'}</span
											>
											{#if selectedOption?.description}
												<span class="text-muted-foreground font-medium"
													>{selectedOption.description}</span
												>
											{/if}
										{/if}
									</div>
									<ChevronsUpDownIcon class="shrink-0 opacity-50" />
								</Popover.Trigger> <input hidden value={entry.productId} name={props.name} />
								<Popover.Content class="w-[300px] p-0">
									<Command.Root shouldFilter={false}>
										<Command.Input
											autofocus
											placeholder="Meklēt produktus..."
											class="h-9"
											value={getSearchQuery(index)}
											oninput={(e) => {
												const target = e.target as HTMLInputElement;
												if (target) {
													setSearchQuery(index, target.value);
												}
											}}
										/>
										{@const filteredOptions = getFilteredOptions(getSearchQuery(index))}
										{#if filteredOptions.length === 0}
											<Command.Empty>Šāds produkts netika atrasts!</Command.Empty>
										{/if}
										<Command.Group class="custom-scroll max-h-64 overflow-y-auto">
											{#each filteredOptions as product (product.value)}
												<Command.Item
													value={`${product.label} ${product.description}`}
													onSelect={() => {
														$formData.taskProducts[index].productId = Number(product.value);
														touchedProducts.add(index);
														touchedProducts = new Set(touchedProducts);
														// Clear search query after selection
														setSearchQuery(index, '');
													}}
													class="flex items-start gap-1 py-2"
												>
													<div class="flex w-full items-center justify-between gap-2">
														<span class="font-medium">{product.label}</span>
														{#if product.description}
															<span class="text-muted-foreground text-xs"
																>{product.description}</span
															>
														{/if}
														<CheckIcon
															class={cn(
																'ml-auto shrink-0',
																product.value !== entry.productId && 'text-transparent'
															)}
														/>
													</div>
												</Command.Item>
											{/each}
										</Command.Group>
									</Command.Root>
								</Popover.Content>
							</Popover.Root>
						{/snippet}
					</Form.Control>
					{#if touchedProducts.has(index)}
						<Form.FieldErrors />
					{/if}
				</Form.Field>

				<Form.Field {form} name={`taskProducts[${index}].count`} class="flex flex-col">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Skaits</Form.Label>
							<NumberInput bind:value={$formData.taskProducts[index].count} {...props} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				{#if $formData.taskProducts.length > 1}
					<Button
						type="button"
						variant="outline"
						size="icon"
						onclick={() => removeEntry(index)}
						title="Noņemt produktu"
						class="mb-2"
					>
						<X class="h-4 w-4" />
					</Button>
				{/if}
			</div>
		{/each}
	</Form.Fieldset>
</div>
<!-- Total Price (read-only) -->
<div class="mt-4 flex items-center gap-2">
	<Label for="price">Kopējā cena (€)</Label>

	€{formatPrice(totalPrice)}

	<Button variant="ghost" onclick={addEntry}>+ Pievienot produktu</Button>
</div>
