<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { type SuperValidated, type Infer, superForm, type SuperForm } from 'sveltekit-superforms';

	import { z } from 'zod';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { tick } from 'svelte';
	import { cn, debounce } from '$lib/utils.js';
	import { useId } from 'bits-ui';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';

	import { Input } from '$lib/components/ui/input/index.js';
	import type { Client } from '$lib/server/db/schema';
	import type { taskSchema } from './schema';

	let { clients, form } = $props<{
		clients?: Client[];
		form?: SuperForm<z.infer<typeof taskSchema>>;
	}>(); // State for dynamic client search
	let searchedClients = $state<Client[]>([]);
	let displayClients = $state<Client[]>([]);
	let isSearching = $state(false);
	let searchTerm = $state('');

	// Initialize with provided clients
	if (clients && clients.length > 0) {
		searchedClients = clients;
		displayClients = clients;
	}

	// Search function without debounce
	async function performSearch(term: string) {
		searchTerm = term;

		if (term.length === 0) {
			searchedClients = clients || [];
			displayClients = clients || [];
			isSearching = false;
			return;
		}

		isSearching = true;

		try {
			const response = await fetch(`/api/clients/search?q=${encodeURIComponent(term)}`);
			if (response.ok) {
				const results = await response.json();
				// Only update if this is still the current search term
				if (term === searchTerm) {
					searchedClients = results;
					displayClients = results; // Update display only when search completes
					isSearching = false;
				}
			} else {
				// Handle HTTP errors
				if (term === searchTerm) {
					searchedClients = [];
					displayClients = [];
					isSearching = false;
				}
			}
		} catch (error) {
			console.error('Error searching clients:', error);
			// Only update if this was the current search
			if (term === searchTerm) {
				searchedClients = [];
				displayClients = [];
				isSearching = false;
			}
		}
	}

	// Debounced search function using utils.ts debounce
	const searchClients = debounce(performSearch, 300);

	let showAddForm = $state(false);

	let open = $state(false);
	let formData = form.form;

	// Helper function to get client contact info (phone preferred, fallback to email)
	function getClientContact(client: Client): string {
		if (client.phone) return client.phone;
		if (client.email) return client.email;
		return '';
	}

	// Helper function to format client display text
	function formatClientDisplay(client: Client): string {
		const contact = getClientContact(client);
		return contact ? `${client.name} (${contact})` : client.name;
	}

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
	<div class="flex items-end gap-2">
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
							{(() => {
								const selectedClient = searchedClients.find((f) => f.id === $formData.clientId);
								return selectedClient ? formatClientDisplay(selectedClient) : 'Izvēlies klientu...';
							})()}
							<ChevronsUpDownIcon class="opacity-50" />
						</Popover.Trigger><input hidden value={$formData.clientId} name={props.name} />
					{/snippet}
				</Form.Control>
				<Popover.Content class="w-[var(--bits-popover-anchor-width)] p-0">
					<Command.Root class="w-full max-w-full" shouldFilter={false}>
						<Command.Input
							autofocus
							placeholder="Meklēt klientu..."
							class="h-9"
							value={searchTerm}
							oninput={(e) => searchClients(e.currentTarget.value)}
						/>
						<Command.Empty>
							{#if isSearching}
								Meklē...
							{:else if searchTerm.length === 0}
								Sāciet rakstīt, lai meklētu klientus
							{:else}
								Šāds klients netika atrasts
							{/if}
						</Command.Empty>
						<Command.Group value="clients" class="custom-scroll max-h-64 overflow-y-auto">
							{#if isSearching}
								<Command.Item disabled>Meklē...</Command.Item>
							{:else}
								{#each displayClients as client (client.id)}
									<Command.Item
										value={client.name}
										onSelect={() => {
											$formData.clientId = client.id;
											closeAndFocusTrigger(triggerId);
										}}
									>
										<div class="flex w-full gap-2">
											<span class="font-medium">{client.name}</span>
											{#if getClientContact(client)}
												<span class="text-muted-foreground text-sm">{getClientContact(client)}</span
												>
											{/if}
										</div>
										<CheckIcon
											class={cn(
												'ml-auto flex-shrink-0',
												client.id !== $formData.clientId && 'text-transparent'
											)}
										/>
									</Command.Item>
								{/each}
							{/if}
						</Command.Group>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>

			<Form.FieldErrors />
		</Form.Field>
		<Button
			class="mb-2"
			variant="outline"
			onclick={() => {
				showAddForm = true;
				$formData.clientId = null;
				$formData.newClientType = 'BTC';
			}}>Pievienot</Button
		>
	</div>
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
