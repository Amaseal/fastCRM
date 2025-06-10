<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let { items }: { items: { title: string; url: string; icon?: any }[] } = $props();
</script>

<Sidebar.Group class="mt-8">
	<Sidebar.GroupContent class="flex flex-col gap-2">
		<Sidebar.Menu class="flex flex-col gap-4">
			{#each items as item (item.title)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={item.title}>
						{#snippet child({ props })}
							<a href={item.url} {...props} class="flex items-end gap-2">
								{#if item.icon}
									<item.icon />
								{/if}
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
