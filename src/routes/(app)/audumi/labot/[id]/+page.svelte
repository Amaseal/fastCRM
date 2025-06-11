<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { materialSchema, type MaterialSchema } from '../../schema';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import X from '@lucide/svelte/icons/x';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { browser } from '$app/environment';
	import type { Material } from '$lib/server/db/schema';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';

	const flash = getFlash(page);

	let { data }: { data: { form: SuperValidated<Infer<MaterialSchema>>; item: Material } } =
		$props();

	const form = superForm(data.item, {
		validators: zodClient(materialSchema)
	});

	const { form: formData, enhance } = form;

	$effect(() => {
		if (data.item.image) {
			imagePath = data.item.image;
		}
	});

	let imagePath = $state<string | null>(null);
	let isUploading = $state(false);
	let uploadProgress = $state(0);
	let fileInputElement: HTMLInputElement;

	async function handleInputChange(event: Event) {
		if (!browser) return;
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const uploadData = new FormData();
		uploadData.append('file', file);

		isUploading = true;
		uploadProgress = 0;
		try {
			const res = await fetch('/api/upload', {
				method: 'POST',
				body: uploadData
			});
			const data = await res.json();
			if (data.success && data.path) {
				imagePath = data.path;
				formData.update((current) => ({ ...current, image: data.path }));
				uploadProgress = 100;
				$flash = { type: 'success', message: 'Bilde augšuplādēta veiksmīgi!' };
			} else {
				$flash = { type: 'error', message: 'Kaut kas nogāja greizi!' };
			}
		} catch (e) {
			$flash = { type: 'error', message: 'Kaut kas nogāja greizi!' };
		} finally {
			isUploading = false;
		}
	}

	async function resetImage() {
		if (!browser) return;
		if (imagePath) {
			try {
				await fetch('/api/remove', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ path: imagePath })
				});
			} catch (e) {
				$flash = { type: 'error', message: 'Kaut kas nogāja greizi!' };
			}
		}
		imagePath = null;
		formData.update((current) => ({ ...current, image: '' }));
		$flash = { type: 'success', message: 'Bilde izdzēsta veiksmīgi!' };
		if (fileInputElement) fileInputElement.value = '';
	}
</script>

<svelte:head>
	<title>Pievienot audumu</title>
</svelte:head>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
	<div class="max-h-[90vh] w-full max-w-md overflow-hidden rounded-lg">
		<Card.Root class="custom-scroll relative max-h-[90vh] w-full max-w-md gap-2 overflow-y-auto">
			<Card.Header>
				<a
					href="/audumi"
					class="text-muted-foreground hover:text-foreground absolute top-7 right-5 text-sm font-medium transition-colors"
					><X /></a
				>

				<h2 class="mb-2 text-lg font-semibold">Pievienot jaunu audumu</h2>
			</Card.Header>
			<Card.Content class="p-6">
				<form method="POST" use:enhance>
					<div class="grid gap-3 py-4">
						<Form.Field {form} name="title">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Nosaukums</Form.Label>
									<Input
										placeholder="F02, 2007, Raghok 3, utt..."
										{...props}
										bind:value={$formData.title}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="article">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Artikuls</Form.Label>
									<Input
										placeholder="F02, 2007, Raghok 3, utt..."
										{...props}
										bind:value={$formData.article}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="manufacturer">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Ražotājs</Form.Label>
									<Input placeholder="Ražotājs" {...props} bind:value={$formData.manufacturer} />
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="gsm">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>GSM</Form.Label>
									<Input
										type="number"
										placeholder="100, 200 utt..."
										{...props}
										bind:value={$formData.gsm}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="width">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Platums (mm)</Form.Label>
									<Input
										type="number"
										placeholder="1600, 1440 utt..."
										{...props}
										bind:value={$formData.width}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="remaining">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Atlicis (ruļļi)</Form.Label>
									<Input
										type="number"
										placeholder="4, 3 utt..."
										{...props}
										bind:value={$formData.remaining}
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="image">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Bilde</Form.Label>
									<!-- Drop Zone -->
									<div
										class="bg-input/30 flex h-[100px] cursor-pointer items-center justify-center rounded-2xl border border-dashed px-4 text-center transition-colors"
										onclick={() => fileInputElement?.click()}
										onkeydown={() => fileInputElement?.click()}
										role="button"
										tabindex="0"
									>
										{#if imagePath}
											<div class="flex items-center gap-3">
												<div class="relative h-[100px] w-[100px]">
													<img
														src={imagePath}
														alt="preview"
														class="h-[100px] w-[100px] object-contain"
													/>

													{#if isUploading}
														<!-- Upload progress overlay -->
														<div
															class="absolute inset-0 flex items-center justify-center bg-black/50"
														>
															<div class="flex flex-col items-center gap-2">
																<Loader2 class="h-5 w-5 animate-spin text-white" />
																<div class="h-1 w-16 overflow-hidden rounded bg-zinc-700">
																	<div
																		class="h-full bg-violet-500"
																		style="width: {uploadProgress}%"
																	></div>
																</div>
																<span class="text-xs text-white">{uploadProgress}%</span>
															</div>
														</div>
													{/if}
												</div>
												<Button
													type="button"
													onclick={resetImage}
													variant="ghost"
													disabled={isUploading}
												>
													<Trash2 /> Noņemt
												</Button>
											</div>
										{:else}
											<p class="text-muted-foreground text-center text-sm">
												Klikšķini vai ievelc šeit lai pievienotu bildi
											</p>
										{/if}
										<!-- Hidden input for file uploads (just for selecting files) -->
										<input
											type="file"
											bind:this={fileInputElement}
											accept="image/*"
											class="hidden"
											onchange={handleInputChange}
										/>

										<!-- Hidden input for SuperForms to receive the file path -->
										<input type="hidden" name="image" bind:value={$formData.image} />
									</div>
								{/snippet}
							</Form.Control>
						</Form.Field>
					</div>

					<div class="mt-6 flex justify-end">
						<Button type="submit" disabled={isUploading}>
							{#if isUploading}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								<span>Augšupielāde...</span>
							{:else}
								<span>Saglabāt</span>
							{/if}
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</div>
