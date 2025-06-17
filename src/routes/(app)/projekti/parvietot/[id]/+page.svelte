<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { Task } from '$lib/server/db/schema.js';
	import X from '@lucide/svelte/icons/x';
	let { data }: { data: { item: Task } } = $props();
</script>

<svelte:head>
	<title>Pārvietot {data.item.title}</title>
</svelte:head>
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
	<div class="max-h-[90vh] w-full max-w-md overflow-hidden rounded-lg">
		<Card.Root class="custom-scroll relative max-h-[90vh] w-full max-w-md gap-2 overflow-y-auto">
			<Card.Header>
				<a
					href="/projekti"
					class="text-muted-foreground hover:text-foreground absolute top-8 right-5 text-sm font-medium transition-colors"
					><X /></a
				>
				<h2 class="text-lg font-semibold">
					Vai tiešām vēlies pārvietot {data.item?.title} uz pabeigto?
				</h2>
				<p>Projekts tiks pārvietots uz "done" sarakstu. Faili un bildes tiks izdzēstas!</p>
			</Card.Header>
			<Card.Content class="p-6 pb-2">
				<form method="POST" use:enhance>
					<div class="flex items-center justify-end gap-2">
						<Button href="/projekti" variant="secondary">Atcelt</Button>
						<Button type="submit" variant="destructive">Pārvietot</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</div>
