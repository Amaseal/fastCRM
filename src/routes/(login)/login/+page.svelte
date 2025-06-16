<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	import * as Form from '$lib/components/ui/form/index.js';
	import { userSchema, type UserSchema } from '../schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Button } from '$lib/components/ui/button';

	let { data }: { data: { form: SuperValidated<Infer<UserSchema>> } } = $props();

	const form = superForm(data.form, {
		validators: zodClient(userSchema)
	});

	const { form: formData, enhance } = form;
</script>

<svelte:head>
	<title>Pieslēgties</title>
</svelte:head>

<div class="flex h-screen w-full items-center justify-center bg-[url(background.svg)] px-4">
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Pieslēgties</Card.Title>
			<Card.Description>Ievadi e-pastu un paroli lai pieslēgtos</Card.Description>
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
				<Form.Field {form} name="password">
					<Form.Control>
						{#snippet children({ props }: { props: Record<string, any> })}
							<Form.Label>Parole</Form.Label>
							<Input {...props} type="password" bind:value={$formData.password} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<div class="flex items-center gap-2">
					<Button type="submit">Pieslēgties</Button>
					<span class="ml-auto">vai</span>
					<Button href="/register" variant="ghost">Reģistrēties</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
