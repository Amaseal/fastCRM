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
	import type { Client, Material, Product, User } from '$lib/server/db/schema';
	import ClientSelect from '$lib/components/client-select.svelte';

	let {
		data
	}: {
		data: {
			form: SuperValidated<Infer<TaskSchema>>;
			users: User[];
			clients: Client[];
			materials: Material[];
			products: Product[];
		};
	} = $props();

	const form = superForm(data.form, {
		validators: zodClient(taskSchema)
	});

	const { form: formData, enhance } = form;
	const currentUser = $derived(page.data.user);
	const df = new DateFormatter('lv-LV', {
		dateStyle: 'long'
	});

	let value = $derived($formData.endDate ? parseDate($formData.endDate) : undefined);
	let selectResponsible = $derived(
		data.users.find((f: { id: string }) => f.id === $formData.responsiblePersonId)?.name ??
			'Izvēlēties'
	);
	let placeholder = $state<DateValue>(today(getLocalTimeZone()));

	const seamstresses = [
		{ value: 'Ikšķile', label: 'Ikšķile' },
		{ value: 'Pie mums', label: 'Pie mums' },
		{ value: 'Vladislavs', label: 'Vladislavs' },
		{ value: 'Lielvārde', label: 'Lielvārde' },
		{ value: 'Pagrabs', label: 'Pagrabs' }
	];
</script>

<svelte:head>
	<title>Pievienot projektu</title>
</svelte:head>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
	<div class="max-h-[90vh] w-full max-w-[90vw] overflow-hidden rounded-lg">
		<Card.Root
			class="custom-scroll relative max-h-[90vh] w-full max-w-[90vw]  gap-2 overflow-y-auto"
		>
			<Card.Header>
				<a
					href="/projekti"
					class="text-muted-foreground hover:text-foreground absolute top-7 right-5 text-sm font-medium transition-colors"
					><X /></a
				>

				<h2 class="text-lg font-semibold">Pievienot jaunu projektu</h2>
			</Card.Header>
			<Card.Content class="p-6 pb-2">
				<form method="POST" use:enhance>
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
														maxValue={today(getLocalTimeZone())}
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
												bind:value={$formData.responsiblePersonId}
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
												bind:value={$formData.seamstress}
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
							</div>

							<div class="w-full">
								<ClientSelect clients={data.clients} {form} />
							</div>
						</div>

						<div class="w-1/2">
							<label for="/">Apraksts</label>
							<Edra />
						</div>
					</div>

					<div class="mt-6 flex justify-end">
						<Button type="submit">Saglabāt</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</div>
