<script lang="ts">
	import '../../app.css';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';
	import background from '$lib/assets/vivid-blurred-colorful-background.jpg';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
	import { ModeWatcher } from 'mode-watcher';
	const flash = getFlash(page, { clearAfterMs: 2000 });

	let { children } = $props();
</script>

<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 48); --header-height: calc(var(--spacing) * 12); "
>
	<AppSidebar />
	<Sidebar.Inset class="m-0 p-0">
		<div class="relative flex flex-1 flex-col">
			<div class=" @container/main relative z-10 m-0 flex flex-1 flex-col gap-2 p-4">
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
				{@render children()}
			</div>
			<div class="dark:bg-background/90 bg-background/60 absolute inset-0 z-2"></div>
			<img
				src={background}
				alt="decorative"
				class="absolute inset-0 h-full w-full rotate-180 bg-cover"
			/>
		</div></Sidebar.Inset
	>
</Sidebar.Provider>
<ModeWatcher />
