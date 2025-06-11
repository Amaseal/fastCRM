<script lang="ts">
	import '../../app.css';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';

	const flash = getFlash(page, { clearAfterMs: 5000 });

	let { children } = $props();
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 48); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar variant="inset" />
	<Sidebar.Inset>
		<div class="relative flex flex-1 flex-col">
			<div class="@container/main flex flex-1 flex-col gap-2 p-4">
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
							<Alert.Title>izdevās!</Alert.Title>
							<Alert.Description>{$flash.message}</Alert.Description>
						</Alert.Root>
					{/if}
				{/if}
				{@render children()}
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
