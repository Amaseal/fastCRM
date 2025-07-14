<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Button from '$lib/components/ui/button/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Bell from '@lucide/svelte/icons/bell';
	import Check from '@lucide/svelte/icons/check';
	import CheckCheck from '@lucide/svelte/icons/check-check';
	import Clock from '@lucide/svelte/icons/clock';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';

	let { notifications = [] } = $props<{
		notifications: Array<{
			id: number;
			message: string;
			taskId?: number;
			task?: { id: number; title: string } | null;
			created_at: Date;
			isRead: boolean;
		}>;
	}>();

	// Format relative time
	function formatRelativeTime(date: Date): string {
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));

		if (diffInMinutes < 1) return 'Tikko';
		if (diffInMinutes < 60) return `Pirms ${diffInMinutes} min`;

		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `Pirms ${diffInHours} h`;

		const diffInDays = Math.floor(diffInHours / 24);
		if (diffInDays === 1) return 'Vakar';
		if (diffInDays < 7) return `Pirms ${diffInDays} dienām`;

		return new Date(date).toLocaleDateString('lv-LV');
	}

	// Mark notification as read
	async function markAsRead(notificationId: number) {
		try {
			const response = await fetch('/api/notifications/read', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ notificationId })
			});

			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error marking notification as read:', error);
		}
	}

	// Mark all notifications as read
	async function markAllAsRead() {
		try {
			const response = await fetch('/api/notifications/read', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ markAllAsRead: true })
			});

			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Error marking all notifications as read:', error);
		}
	}

	// Navigate to project
	async function navigateToProject(taskId: number, notificationId: number) {
		// Mark as read first
		await markAsRead(notificationId);
		// Navigate to project
		goto(`/projekti/labot/${taskId}`);
	}

	const unreadCount = $derived(notifications.filter((n) => !n.isRead).length);
</script>

<Card.Root class="h-full">
	<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-3">
		<div class="flex items-center gap-2">
			<Bell class="h-4 w-4" />
			<Card.Title class="text-sm font-medium">Paziņojumi</Card.Title>
			{#if unreadCount > 0}
				<Badge variant="destructive" class="h-5 px-1.5 text-xs">
					{unreadCount}
				</Badge>
			{/if}
		</div>
		{#if unreadCount > 0}
			<Button.Root variant="ghost" size="sm" class="h-8 px-2 text-xs" onclick={markAllAsRead}>
				<CheckCheck class="mr-1 h-3 w-3" />
				Atzīmēt visus
			</Button.Root>
		{/if}
	</Card.Header>
	<Card.Content class="space-y-3">
		{#if notifications.length === 0}
			<div class="text-muted-foreground py-6 text-center text-sm">
				<Bell class="mx-auto mb-2 h-8 w-8 opacity-50" />
				Nav jaunu paziņojumu
			</div>
		{:else}
			{#each notifications as notification (notification.id)}
				<div
					class="hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors {notification.isRead
						? 'opacity-70'
						: 'bg-muted/20'}"
				>
					<div class="flex-1 space-y-1">
						<p
							class="text-sm {notification.isRead
								? 'text-muted-foreground'
								: 'text-foreground font-medium'}"
						>
							{notification.message}
						</p>
						<div class="text-muted-foreground flex items-center gap-2 text-xs">
							<Clock class="h-3 w-3" />
							{formatRelativeTime(notification.created_at)}
						</div>
					</div>
					<div class="flex flex-col gap-1">
						{#if !notification.isRead}
							<Button.Root
								variant="ghost"
								size="sm"
								class="h-6 w-6 p-0"
								onclick={() => markAsRead(notification.id)}
							>
								<Check class="h-3 w-3" />
							</Button.Root>
						{/if}
						{#if notification.taskId}
							<Button.Root
								variant="outline"
								size="sm"
								class="h-6 px-2 text-xs"
								onclick={() => navigateToProject(notification.taskId!, notification.id)}
							>
								Skatīt
							</Button.Root>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</Card.Content>
</Card.Root>
