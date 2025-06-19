<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { taskSchema, type TaskSchema } from '../schema';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import X from '@lucide/svelte/icons/x';
	import Edra from '$lib/components/edra.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { CalendarIcon } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import {
		CalendarDate,
		DateFormatter,
		type DateValue,
		getLocalTimeZone,
		parseDate,
		today
	} from '@internationalized/date';
	import { Calendar } from '$lib/components/ui/calendar';
	import NumberInput from '$lib/components/ui/input/number-input.svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { page } from '$app/state';
	import { page as pageStore } from '$app/stores';
	import type { Client, Material, Product, User } from '$lib/server/db/schema';
	import ClientSelect from '../client-select.svelte';
	import MultiSelectCombobox from '../multi-select-combobox.svelte';
	import TaskFiles from '../task-files.svelte';
	import ProductSelect from '../product-select.svelte';
	import MoneyInput from '$lib/components/ui/input/money-input.svelte';
	import Dropzone from '$lib/components/dropzone.svelte';

	let {
		data
	}: {
		data: {
			form: SuperValidated<Infer<TaskSchema>>;
			users: User[];
			clients: Client[];
			tabId: number;
			materials: Material[];
			products: Product[];
		};
	} = $props();
	const form = superForm(data.form, {
		dataType: 'json',
		validators: zodClient(taskSchema),
		onError: ({ result }) => {
			// Only log actual errors, not redirects
			if (result.type === 'error') {
				console.error('Form submission error:', result.error);
			}
		}
	});

	const { form: formData, form: errors, form: allErrors, enhance } = form;
	const currentUser = $derived(page.data.user);
	const df = new DateFormatter('lv-LV', {
		dateStyle: 'long'
	});

	let value = $derived($formData.endDate ? parseDate($formData.endDate) : undefined);
	let selectResponsible = $derived(
		data.users.find((f: { id: string }) => f.id === $formData.responsiblePersonId)?.name ??
			'Izvēlēties'
	);

	$effect(() => {
		if (!$formData.tabId) {
			$formData.tabId = data.tabId;
		}
		if (!$formData.managerId) {
			$formData.managerId = currentUser?.id;
		}
	});
	let placeholder = $state<DateValue>(today(getLocalTimeZone()));
	const seamstresses = [
		{ value: 'Ikšķile', label: 'Ikšķile' },
		{ value: 'Pie mums', label: 'Pie mums' },
		{ value: 'Vladislavs', label: 'Vladislavs' },
		{ value: 'Lielvārde', label: 'Lielvārde' },
		{ value: 'Pagrabs', label: 'Pagrabs' }
	];

	// Create URL with preserved search parameters
	const backUrl = $derived(
		$pageStore.url.searchParams.toString()
			? `/projekti?${$pageStore.url.searchParams.toString()}`
			: '/projekti'
	);
</script>

<svelte:head>
	<title>Pievienot projektu</title>
</svelte:head>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
	<div class="max-h-[90vh] w-full max-w-[90vw] overflow-hidden rounded-lg xl:max-w-[60vw]">
		<Card.Root
			class="custom-scroll relative max-h-[90vh] w-full max-w-[90vw]  gap-2 overflow-y-auto"
		>
			<Card.Header>
				<a
					href={backUrl}
					class="text-muted-foreground hover:text-foreground absolute top-7 right-5 text-sm font-medium transition-colors"
					><X /></a
				>

				<h2 class="text-lg font-semibold">Pievienot jaunu projektu</h2>
			</Card.Header>
			<Card.Content class="p-6 pb-2">
				<form method="POST" use:enhance enctype="multipart/form-data">
					<!-- Hidden field to submit tabId -->
					<input type="hidden" name="tabId" bind:value={$formData.tabId} />

					<div class="flex gap-2">
						<div class="w-1/2">
							<div class="flex gap-2">
								<Form.Field {form} name="title" class="w-1/2">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Nosaukums</Form.Label>
											<Input
												placeholder="Jānis, Made, utt..."
												{...props}
												bind:value={$formData.title}
											/>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
								<Form.Field {form} name="endDate" class="flex w-1/2 flex-col">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label class="mt-1 mb-1">Nodošanas datums</Form.Label>
											<Popover.Root>
												<Popover.Trigger
													{...props}
													class={cn(
														buttonVariants({ variant: 'outline' }),
														'bg-background w-full justify-start pl-4 text-left font-normal',
														!value && 'text-muted-foreground'
													)}
												>
													{value ? df.format(value.toDate(getLocalTimeZone())) : 'Izvēlies datumu'}
													<CalendarIcon class="ml-auto size-4 opacity-50" />
												</Popover.Trigger>
												<Popover.Content class="w-auto p-0" side="top">
													<Calendar
														type="single"
														value={value as DateValue}
														bind:placeholder
														minValue={new CalendarDate(1900, 1, 1)}
														calendarLabel="Nodošanas datums"
														onValueChange={(v) => {
															if (v) {
																$formData.endDate = v.toString();
															} else {
																$formData.endDate = '';
															}
														}}
													/>
												</Popover.Content>
											</Popover.Root>
											<Form.FieldErrors />
											<input hidden value={$formData.endDate} name={props.name} />
										{/snippet}
									</Form.Control>
								</Form.Field>
								<Form.Field {form} name="count">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Skaits</Form.Label>
											<NumberInput {...props} bind:value={$formData.count} />
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							</div>
							<div class="flex gap-2">
								<Form.Field {form} name="responsiblePersonId" class="w-1/2">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Atbildīgā persona</Form.Label>
											<Select.Root
												type="single"
												name={props.name}
												bind:value={$formData.responsiblePersonId as string}
											>
												<Select.Trigger class="w-full">
													{selectResponsible}
												</Select.Trigger>
												<Select.Content>
													{#each data.users as user}
														<Select.Item value={user.id}>{user.name}</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
								<Form.Field {form} name="seamstress" class="w-1/2">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Šujās</Form.Label>
											<Select.Root
												type="single"
												name={props.name}
												bind:value={$formData.seamstress as string}
											>
												<Select.Trigger class="w-full">
													{$formData.seamstress ? $formData.seamstress : 'Izvēlies šuvēju'}
												</Select.Trigger>
												<Select.Content>
													{#each seamstresses as seamstress}
														<Select.Item value={seamstress.value}>{seamstress.label}</Select.Item>
													{/each}
												</Select.Content>
											</Select.Root>
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
								<Form.Field {form} name="price">
									<Form.Control>
										{#snippet children({ props })}
											<Form.Label>Cena</Form.Label>
											<MoneyInput {...props} bind:value={$formData.price} />
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							</div>
							<div class="w-full">
								<MultiSelectCombobox materials={data.materials} {form} />
							</div>

							<div class="w-full">
								<ClientSelect clients={data.clients} {form} />
							</div>

							<div>
								<label for="files">Faili:</label>
								<TaskFiles {form} />
							</div>
							<div class="w-full">
								<ProductSelect products={data.products} {form} />
							</div>
						</div>

						<div class="w-1/2">
							<label for="/">Apraksts</label>
							<Edra bind:value={$formData.description as string} name="description" />
						</div>
					</div>
					<Form.Field {form} name="preview">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Cena</Form.Label>
								<Dropzone bind:value={$formData.preview} {...props} name="preview" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<input type="hidden" name="tabId" bind:value={$formData.tabId} />
					<input type="hidden" name="managerId" bind:value={$formData.managerId} />

					<div class="mt-6 flex justify-end">
						<Button type="submit">Saglabāt</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</div>
