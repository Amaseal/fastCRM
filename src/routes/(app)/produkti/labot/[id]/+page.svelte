<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { productSchema, type ProductSchema } from '../../schema';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import X from '@lucide/svelte/icons/x';
	import MoneyInput from '$lib/components/ui/input/money-input.svelte';
	import type { Product } from '$lib/server/db/schema';

	let { data }: { data: { form: SuperValidated<Infer<ProductSchema>>; item: Product } } = $props();

	const form = superForm(data.item, {
		validators: zodClient(productSchema)
	});

	const { form: formData, enhance } = form;

	$inspect($formData);
</script>

<svelte:head>
	<title>Pievienot klientu</title>
</svelte:head>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
	<div class="max-h-[90vh] w-full max-w-md overflow-hidden rounded-lg">
		<Card.Root class="custom-scroll relative max-h-[90vh] w-full max-w-md gap-2 overflow-y-auto">
			<Card.Header>
				<a
					href="/produkti"
					class="text-muted-foreground hover:text-foreground absolute top-7 right-5 text-sm font-medium transition-colors"
					><X /></a
				>

				<h2 class=" text-lg font-semibold">Labot {data.item.title}</h2>
			</Card.Header>
			<Card.Content class="p-6 pb-2">
				<form method="POST" use:enhance>
					<Form.Field {form} name="title">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Nosaukums</Form.Label>
								<Input placeholder="Nosaukums" {...props} bind:value={$formData.title} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="description">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Apraksts</Form.Label>
								<Textarea
									class="bg-background"
									placeholder="Motokrosa krekls ar sietu sānos"
									{...props}
									bind:value={$formData.description}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="cost">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Cena</Form.Label>
								<MoneyInput
									currency="EUR"
									placeholder="5.70"
									{...props}
									bind:value={$formData.cost}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<div class="mt-6 flex justify-end">
						<Button type="submit">Saglabāt</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</div>
