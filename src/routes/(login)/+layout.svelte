<script lang="ts">
	import '../../app.css';

	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';

	const flash = getFlash(page, { clearAfterMs: 5000 });
	import * as Alert from '$lib/components/ui/alert/index.js';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	let { children } = $props();
</script>

<main class="relative h-screen">
	{@render children()}
	{#if $flash}
		{#if $flash.type === 'error'}
			<Alert.Root variant="destructive" class="absolute right-6 bottom-6 z-[1000] max-w-96">
				<AlertCircleIcon />
				<Alert.Title>Kļuda</Alert.Title>
				<Alert.Description>
					{$flash.message}
				</Alert.Description>
			</Alert.Root>
		{:else if $flash.type === 'success'}
			<Alert.Root class="absolute right-6 bottom-6 z-[1000] max-w-96">
				<CheckCircle2Icon />
				<Alert.Title>Izdevās!</Alert.Title>
				<Alert.Description>{$flash.message}</Alert.Description>
			</Alert.Root>
		{/if}
	{/if}
</main>
