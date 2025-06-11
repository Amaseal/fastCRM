<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { userSchema, type UserSchema } from '../schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let { data }: { data: { form: SuperValidated<Infer<UserSchema>> } } = $props();

	const form = superForm(data.form, {
		validators: zodClient(userSchema)
	});

	const { form: formData, enhance } = form;
</script>

<svelte:head>
	<title>Reģistrēties</title>
</svelte:head>

<div
	class="flex h-screen w-full items-center justify-center bg-[url(background.svg)] bg-cover bg-left px-4"
>
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Reģistrēties</Card.Title>
			<Card.Description>Ievadi e-pastu un paroli lai reģistrētos</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="post" use:enhance>
				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children({ props }: { props: Record<string, any> })}
							<Form.Label>Epasts</Form.Label>
							<Input {...props} bind:value={$formData.email} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props }: { props: Record<string, any> })}
							<Form.Label>Vārds</Form.Label>
							<Input {...props} bind:value={$formData.name} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="password">
					<Form.Control>
						{#snippet children({ props }: { props: Record<string, any> })}
							<Form.Label>Parole</Form.Label>
							<Input {...props} type="password" bind:value={$formData.password} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Button class="mt-4" disabled={!form}>Reģistrēties</Form.Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
