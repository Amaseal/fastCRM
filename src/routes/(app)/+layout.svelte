<script lang="ts">
	import '../../app.css';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/state';

	const flash = getFlash(page);

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
					<div class="absolute right-0 bottom-0 z-50 w-full max-w-xs p-4">
						<div class="flash">{$flash.message}</div>
					</div>
				{/if}
				{@render children()}
			</div>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
