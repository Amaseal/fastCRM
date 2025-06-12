<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button';
	import { superForm } from 'sveltekit-superforms';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { taskSchema } from './/schema';
	import * as Form from '$lib/components/ui/form/index.js';
	import { z } from 'zod';
	import { ElementField } from 'formsnap';
	import NumberInput from '$lib/components/ui/input/number-input.svelte';

	interface Product {
		id: string | number;
		title: string;
		cost: number;
	}

	interface ProductEntry {
		productId: string;
		count: number;
	}
	let {
		products,
		form
	}: {
		products: Product[];
		form: SuperForm<z.infer<typeof taskSchema>>;
		initialProductIds?: number[];
	} = $props();

	// Access form data directly
	let formData = form.form;

	// Add a new product entry
	function addEntry() {
		if (!$formData.taskProducts) $formData.taskProducts = [];
		$formData.taskProducts = [...$formData.taskProducts, { productId: '', count: 1 }];
	}

	// Remove a product entry
	function removeEntry(index: number) {
		$formData.taskProducts = $formData.taskProducts.filter((_, i) => i !== index);
	}

	$inspect($formData, ' formdata');

	// Calculate total price based on selected products and counts
	function calculatePrice() {
		let totalPrice = 0;
		($formData.taskProducts || []).forEach((entry) => {
			const product = products.find((p) => p.id.toString() === entry.productId);
			if (product) {
				totalPrice += product.cost * entry.count;
			}
		});
		return totalPrice;
	}

	// Format price from cents to currency format (e.g., 1233 → 12.33)
	function formatPriceForDisplay(priceInCents: number): string {
		return (priceInCents / 100).toFixed(2);
	}

	// Watch $formData.taskProducts for changes and update price accordingly
	$effect(() => {
		const newPrice = calculatePrice();
		if ($formData.price !== newPrice) {
			$formData.price = newPrice;
		}
	});
</script>

<div class="mb-3">
	<div class="flex items-center justify-between">
		<label for="productIds">Produkti</label>
		<button
			type="button"
			onclick={addEntry}
			class="inline-flex items-center gap-x-1 rounded-lg text-sm hover:text-violet-500"
		>
			Pievienot
		</button>
	</div>

	<div class="space-y-3">
		<Form.Fieldset {form} name="taskProducts" class="w-full">
			{#each $formData.taskProducts as entry, index}
				<Form.ElementField {form} name={`taskProducts[${index}]` as any} class="flex w-full gap-2">
					<Form.Control>
						{#snippet children({ props })}
							<Select.Root
								bind:value={$formData.taskProducts[index].productId}
								type="single"
								name={`taskProducts[${index}].productId`}
								required
							>
								<Select.Trigger class="w-full">
									{products.find((p) => p.id.toString() === $formData.taskProducts[index].productId)
										?.title || 'Izvēlēties'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="">Izvēlēties</Select.Item>
									{#each products as product}
										<Select.Item value={product.id.toString()}>{product.title}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<NumberInput bind:value={$formData.taskProducts[index].count} />
							{#if $formData.taskProducts.length > 1}
								<Button
									type="button"
									variant="outline"
									onclick={() => removeEntry(index)}
									title="Remove product"
								>
									close
								</Button>
							{/if}
						{/snippet}
					</Form.Control>
				</Form.ElementField>
			{/each}
		</Form.Fieldset>
	</div>
	<!-- Total Price (read-only) -->
	<div class="mt-4">
		<Label for="price">Kopējā cena (€)</Label>
		<div class="relative flex items-center">
			<Input
				id="price"
				type="number"
				value={Number(formatPriceForDisplay($formData.price || 0))}
				step="0.01"
				readonly
			/>
			<span class="text-muted-foreground absolute right-3">€</span>
			<!-- Hidden input for SuperForm to bind the price value in cents -->
			<input type="hidden" name="price" bind:value={$formData.price} />
		</div>
	</div>
</div>
