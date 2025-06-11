<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { type SuperValidated, type Infer, superForm, type SuperForm } from 'sveltekit-superforms';

	import { z } from 'zod';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { tick } from 'svelte';
	import { cn } from '$lib/utils.js';
	import { useId } from 'bits-ui';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';

	import { Input } from '$lib/components/ui/input/index.js';
	import type { Client } from '$lib/server/db/schema';
	import type { taskSchema } from '../../routes/(app)/projekti/schema';

	let { clients, form } = $props<{
		clients?: Client[];
		form?: SuperForm<z.infer<typeof taskSchema>>;
	}>();

	const clientOptions = clients.map(({ id, name }: Client) => ({
		value: id,
		label: name
	}));

	let showAddForm = $state(false);

	let open = $state(false);

	let formData = form.form;

	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
	const triggerId = useId();

	const types = [
		{ value: 'BTC', label: 'BTC' },
		{ value: 'BTB', label: 'BTB' }
	];
</script>

{#if !showAddForm}
	<Form.Field {form} name="clientId" class="flex w-full flex-col">
		<Popover.Root bind:open>
			<Form.Control id={triggerId}>
				{#snippet children({ props })}
					<Form.Label>Klients</Form.Label>
					<Popover.Trigger
						class={cn(
							buttonVariants({ variant: 'outline' }),
							'justify-between px-3 font-normal',
							!$formData.clientId && 'text-muted-foreground'
						)}
						role="combobox"
						{...props}
					>
						{clientOptions.find((f: { value: any }) => f.value === $formData.clientId)?.label ??
							'Izvēlies klientu...'}
						<ChevronsUpDownIcon class="opacity-50" />
					</Popover.Trigger> <input hidden value={$formData.clientId} name={props.name} />
				{/snippet}
			</Form.Control>
			<Popover.Content class="w-[var(--bits-popover-anchor-width)] p-0">
				<Command.Root class="w-full max-w-full">
					<Command.Input autofocus placeholder="Meklēt klientu..." class="h-9" />
					<Command.Empty
						>Šāds klients netika atrasts
						<Button variant="ghost" onclick={() => (showAddForm = true)}>Pievienot</Button>
					</Command.Empty>
					<Command.Group value="clients">
						{#each clientOptions as client (client.value)}
							<Command.Item
								value={client.label}
								onSelect={() => {
									$formData.clientId = client.value;
									closeAndFocusTrigger(triggerId);
								}}
							>
								{client.label}
								<CheckIcon
									class={cn('ml-auto', client.value !== $formData.clientId && 'text-transparent')}
								/>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>

		<Form.FieldErrors />
	</Form.Field>
{:else}
	<div class="flex items-end gap-2">
		<Form.Field {form} name="newClientName">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Nosaukums</Form.Label>
					<Input
						placeholder="Jānis, Made, utt..."
						{...props}
						bind:value={$formData.newClientName}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="newClientPhone">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Telefons</Form.Label>
					<Input placeholder="+371 23456789" {...props} bind:value={$formData.newClientPhone} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="newClientEmail">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>E-pasts</Form.Label>
					<Input placeholder="janis@gmail.com" {...props} bind:value={$formData.newClientEmail} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="newClientType">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Tips</Form.Label>
					<Select.Root type="single" name="newClientType" bind:value={$formData.newClientType}>
						<Select.Trigger>
							{$formData.newClientType || 'Izvēlies klienta tipu'}
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

		<Button variant="outline" class="mb-2" onclick={() => (showAddForm = false)}>Atcelt</Button>
	</div>
{/if}
