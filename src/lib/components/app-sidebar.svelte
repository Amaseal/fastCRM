<script lang="ts">
	import Calendar from '@lucide/svelte/icons/calendar';
	import BrickWall from '@lucide/svelte/icons/brick-wall';
	import SquareKanban from '@lucide/svelte/icons/square-kanban';
	import User from '@lucide/svelte/icons/user';
	import Blocks from '@lucide/svelte/icons/blocks';
	import Check from '@lucide/svelte/icons/check';
	import NavMain from './nav-main.svelte';

	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';

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
			title: 'Kalendars',
			url: '/kalendars',
			icon: Calendar
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
		}
	];

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class=" data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href="/" {...props} class="flex items-end gap-2">
							<img src="./logo.svg" class="h-8 object-contain" alt="" />
							<span class="text-base font-semibold">Fastbreak CRM</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain {items} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<!-- <NavUser user={data.user} /> -->
	</Sidebar.Footer>
</Sidebar.Root>
