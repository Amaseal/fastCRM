<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import X from '@lucide/svelte/icons/x';

	import { tabSchema, type TabSchema } from '../../schema';
	import { type Tab } from '$lib/server/db/schema';

	let { data }: { data: { form: SuperValidated<Infer<TabSchema>>; item: Tab } } = $props();

	const form = superForm(data.item, {
		validators: zodClient(tabSchema)
	});

	const { form: formData, enhance } = form;

	$inspect($formData);
</script>

<svelte:head>
	<title>Rediģēt {data.item.title}</title>
</svelte:head>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
	<div class="max-h-[90vh] w-full max-w-md overflow-hidden rounded-lg">
		<Card.Root class="custom-scroll relative max-h-[90vh] w-full max-w-md gap-2 overflow-y-auto">
			<Card.Header>
				<a
					href="/projekti"
					class="text-muted-foreground hover:text-foreground absolute top-7 right-5 text-sm font-medium transition-colors"
					><X /></a
				>

				<h2 class="text-lg font-semibold">Rediģēt {data.item.title}</h2>
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
					<Form.Field {form} name="color">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Krāsa</Form.Label>
								<Input
									type="color"
									class="p-0"
									placeholder="fff"
									{...props}
									bind:value={$formData.color}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<div class="mt-6 flex justify-end gap-2">
						<Button
							type="button"
							variant="destructive"
							href="/projekti/saraksti/izdzest/{data.item.id}"
						>
							Izdzēst
						</Button>
						<Button type="submit">Saglabāt</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</div>
