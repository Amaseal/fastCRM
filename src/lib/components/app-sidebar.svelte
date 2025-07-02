<script lang="ts">
	import Calendar from '@lucide/svelte/icons/calendar';
	import BrickWall from '@lucide/svelte/icons/brick-wall';
	import SquareKanban from '@lucide/svelte/icons/square-kanban';
	import User from '@lucide/svelte/icons/user';
	import Blocks from '@lucide/svelte/icons/blocks';
	import Check from '@lucide/svelte/icons/check';
	import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
	import NavMain from './nav-main.svelte';

	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import Save from '@lucide/svelte/icons/save';
	import { SettingsIcon } from '@lucide/svelte';
	const items = [
		{
			title: 'Projekti',
			url: '/projekti',
			icon: SquareKanban
		},
		{
			title: 'Gatavie',
			url: '/pabeigts',
			icon: Check
		},
		{
			title: 'Klienti',
			url: '/klienti',
			icon: User
		},
		{
			title: 'Audumi',
			url: '/audumi',
			icon: BrickWall
		},
		{
			title: 'Produkti',
			url: '/produkti',
			icon: Blocks
		},
		{
			title: 'Faili',
			url: '/faili',
			icon: Save
		},
		{
			title: 'Wordle',
			url: '/spele',
			icon: Gamepad2
		}
	];

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header class="bg-background/20">
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class=" data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href="/" {...props} class="flex items-end gap-2">
							<img src="logo.svg" class="h-8 object-contain" alt="" />
							<span class="text-base font-semibold">Fastbreak CRM</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content class="bg-background/20">
		<NavMain {items} />
	</Sidebar.Content>
	<Sidebar.Footer class="bg-background/20">
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton>
					{#snippet child({ props })}
						<a href="/settings" {...props} class="flex items-end gap-2">
							<SettingsIcon></SettingsIcon>
							<span class="text-base font-semibold">Iestatijumi</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
