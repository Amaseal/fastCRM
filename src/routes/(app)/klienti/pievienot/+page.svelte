<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { clientSchema, type ClientSchema } from '../schema';
	import * as Form from '$lib/components/ui/form/index.js';

	import * as Card from '$lib/components/ui/card/index.js';
	import X from '@lucide/svelte/icons/x';

	let { data }: { data: { form: SuperValidated<Infer<ClientSchema>> } } = $props();

	const form = superForm(data.form, {
		validators: zodClient(clientSchema)
	});

	const { form: formData, enhance } = form;

	const types = [
		{ value: 'BTC', label: 'BTC' },
		{ value: 'BTB', label: 'BTB' }
	];
</script>

<svelte:head>
	<title>Pievienot klientu</title>
</svelte:head>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
	<div class="max-h-[90vh] w-full max-w-md overflow-hidden rounded-lg">
		<Card.Root class="custom-scroll relative max-h-[90vh] w-full max-w-md gap-2 overflow-y-auto">
			<Card.Header>
				<a
					href="/klienti"
					class="text-muted-foreground hover:text-foreground absolute top-7 right-5 text-sm font-medium transition-colors"
					><X /></a
				>

				<h2 class="text-lg font-semibold">Pievienot jaunu klientu</h2>
			</Card.Header>
			<Card.Content class="p-6 pb-2">
				<form method="POST" use:enhance>
					<div class="flex items-center justify-stretch gap-2">
						<Form.Field {form} name="name" class="w-full">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Nosaukums</Form.Label>
									<Input placeholder="Jānis, Made, utt..." {...props} bind:value={$formData.name} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
						<Form.Field {form} name="type">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Tips</Form.Label>
									<Select.Root type="single" name="type" bind:value={$formData.type}>
										<Select.Trigger class="bg-background">
											{$formData.type ? $formData.type : 'Izvēlies klienta tipu'}
										</Select.Trigger>
										<Select.Content>
											{#each types as type (type.value)}
												<Select.Item value={type.value} label={type.label} />
											{/each}
										</Select.Content>
									</Select.Root>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>
					</div>

					<Form.Field {form} name="phone">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Telefons</Form.Label>
								<Input placeholder="+371 23456789" {...props} bind:value={$formData.phone} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="email">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>E-pasts</Form.Label>
								<Input placeholder="janis@gmail.com" {...props} bind:value={$formData.email} />
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
									placeholder="Komanda, vai kompānija, ko parasti pasūta..."
									{...props}
									bind:value={$formData.description}
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
