<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Material } from '$lib/server/db/schema';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import type { taskSchema } from './schema';
	import { type SuperForm } from 'sveltekit-superforms';
	import z from 'zod';
	import { useId } from 'bits-ui';
	import { CheckIcon, ChevronsUpDownIcon, X } from '@lucide/svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { onMount } from 'svelte';

	interface Option {
		value: string;
		label: string;
		remaining?: number;
	}
	const triggerId = useId();

	let {
		value = $bindable(),
		materials = [],
		form
	} = $props<{
		value?: number[];
		materials?: Material[];
		form: SuperForm<z.infer<typeof taskSchema>>;
	}>();
	let formData = form.form;
	let popoverOpen = $state(false);
	let containerRef: HTMLDivElement;

	let selectedMaterials = $state([]) as string[];
	$effect(() => {
		// Initialize selected materials from form data
		if ($formData.materialIds) {
			selectedMaterials = $formData.materialIds.map((id: number) => String(id));
		}
	});

	const options = materials.map(({ id, title, remaining }: Material) => ({
		value: String(id), // Keep as string for the component, but convert back to number when submitting
		label: title,
		remaining: remaining
	}));

	function toggleMaterial(id: string) {
		if (selectedMaterials.includes(id)) {
			selectedMaterials = selectedMaterials.filter((cid) => cid !== id);
		} else {
			selectedMaterials = [...selectedMaterials, id];
		}
		// Convert strings back to numbers for form data
		$formData.materialIds = selectedMaterials.map((id) => Number(id));
		// Close popover after selection
		popoverOpen = false;
	}

	// Handle click outside to close popover
	function handleClickOutside(event: MouseEvent) {
		if (!popoverOpen) return;

		const target = event.target as HTMLElement;
		// Check if click is outside the popover container
		if (containerRef && !containerRef.contains(target)) {
			popoverOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	});
</script>

<div class="relative" bind:this={containerRef}>
	<Form.Field {form} name="materialIds" class="flex w-full flex-col">
		<Popover.Root bind:open={popoverOpen}>
			<Form.Control id={triggerId}>
				{#snippet children({ props })}
					<Form.Label>Audumi</Form.Label>
					<Popover.Trigger
						class={cn(
							buttonVariants({ variant: 'outline' }),
							'text-muted-foreground justify-between px-3 font-normal'
						)}
						role="combobox"
						{...props}
					>
						{#if selectedMaterials.length}
							<div class="flex flex-wrap gap-1">
								{#each options.filter( (opt: { value: string }) => selectedMaterials.includes(opt.value) ) as opt (opt.value)}
									<span
										class="bg-card text-foreground inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
									>
										{opt.label}
										<button
											type="button"
											class="hover:text-primary ml-1 cursor-pointer text-xl text-gray-500 focus:outline-none"
											onclick={(e) => {
												e.stopPropagation(); // Prevent popover from closing
												toggleMaterial(opt.value);
											}}
											aria-label="Noņemt"
										>
											<X />
										</button>
									</span>
								{/each}
							</div>
						{:else}
							Izvēlēties audumu...
						{/if}
						<ChevronsUpDownIcon class="opacity-50" />
					</Popover.Trigger>
					{#each selectedMaterials as id}
						<input type="hidden" name="materialIds" value={Number(id)} />
					{/each}
				{/snippet}
			</Form.Control>
			<Popover.Content class="w-[var(--bits-popover-anchor-width)] p-0">
				<Command.Root class="w-full max-w-full">
					<Command.Input autofocus placeholder="Meklēt audumu..." class="h-9" />
					<Command.Empty>Šāds audums netika atrasts</Command.Empty>
					<Command.Group value="clients" class="custom-scroll max-h-64 overflow-y-auto">
						{#each options as material (material.value)}
							<Command.Item
								value={material.label}
								onSelect={() => {
									toggleMaterial(material.value);
								}}
							>
								{material.label}
								<Separator orientation="vertical" />
								<span> Atlicis: ({material.remaining})</span>

								<CheckIcon
									class={cn(
										'ml-auto',
										!selectedMaterials.includes(material.value) && 'text-transparent'
									)}
								/>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
		<Form.FieldErrors />
	</Form.Field>
</div>
