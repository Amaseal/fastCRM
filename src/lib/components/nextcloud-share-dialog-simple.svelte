<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Loader2, MessageSquare, Users, Lock, Globe } from '@lucide/svelte';
	interface Props {
		taskId: number;
		taskTitle: string;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		onSuccess?: (message: string) => void;
		onError?: (message: string) => void;
	}

	let {
		taskId,
		taskTitle,
		open = $bindable(false),
		onOpenChange,
		onSuccess,
		onError
	}: Props = $props();

	let selectedConversation = $state<string>('');
	let messageType = $state<'rich' | 'plain'>('rich');
	let conversations = $state<any[]>([]);
	let loadingConversations = $state(false);
	let sharing = $state(false);

	// Load conversations when dialog opens
	$effect(() => {
		if (open) {
			loadConversations();
		}
	});

	async function loadConversations() {
		loadingConversations = true;
		try {
			const response = await fetch('/api/nextcloud/conversations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			const result = await response.json();
			if (result.success) {
				conversations = result.conversations;
			} else {
				onError?.(result.error || 'Neizdevās ielādēt sarunas');
			}
		} catch (error) {
			onError?.('Neizdevās savienoties ar Nextcloud');
			console.error(error);
		} finally {
			loadingConversations = false;
		}
	}

	async function shareProject() {
		if (!selectedConversation) {
			onError?.('Lūdzu, izvēlieties sarunu');
			return;
		}

		sharing = true;
		try {
			const response = await fetch('/api/nextcloud/share-project', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					taskId,
					conversationToken: selectedConversation,
					messageType
				})
			});

			const result = await response.json();
			if (result.success) {
				onSuccess?.('Projekts veiksmīgi nosūtīts uz Nextcloud Talk!');
			} else {
				onError?.(result.error || 'Neizdevās nosūtīt projektu');
			}
		} catch (error) {
			onError?.('Neizdevās nosūtīt projektu');
			console.error(error);
		} finally {
			sharing = false;
		}
	}

	function getConversationIcon(type: number) {
		switch (type) {
			case 1:
				return MessageSquare; // One-to-one
			case 2:
				return Users; // Group
			case 3:
				return Globe; // Public
			default:
				return MessageSquare;
		}
	}

	function getConversationTypeLabel(type: number) {
		switch (type) {
			case 1:
				return 'Privāta';
			case 2:
				return 'Grupa';
			case 3:
				return 'Publiska';
			default:
				return 'Nezināma';
		}
	}
</script>

<Dialog.Root bind:open {onOpenChange}>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Nosūtīt "{taskTitle}" uz Nextcloud Talk</Dialog.Title>
			<Dialog.Description>Nosūtīt uzdevuma informāciju uz Nextcloud Talk sarunu</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-6">
			{#if loadingConversations}
				<div class="flex items-center justify-center py-8">
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					<span class="text-muted-foreground text-sm">Ielādē sarunas...</span>
				</div>
			{:else if conversations.length > 0}
				<Separator />

				<!-- Conversation Selection -->
				<div class="space-y-4">
					<h3 class="text-sm font-medium">Izvēlieties sarunu</h3>

					<div class="custom-scroll grid max-h-60 gap-2 overflow-y-auto">
						{#each conversations as conversation}
							{@const IconComponent = getConversationIcon(conversation.type)}
							<label
								class="hover:bg-muted/50 flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors"
							>
								<input
									type="radio"
									bind:group={selectedConversation}
									value={conversation.token}
									class="text-primary"
								/>

								<div class="min-w-0 flex-1">
									<div class="flex items-center space-x-2">
										<IconComponent class="text-muted-foreground h-4 w-4" />
										<span class="truncate font-medium">{conversation.name}</span>
										<Badge variant="secondary" class="text-xs">
											{getConversationTypeLabel(conversation.type)}
										</Badge>
										{#if conversation.hasPassword}
											<Lock class="text-muted-foreground h-3 w-3" />
										{/if}
									</div>

									{#if conversation.description}
										<p class="text-muted-foreground mt-1 truncate text-sm">
											{conversation.description}
										</p>
									{/if}
								</div>
							</label>
						{/each}
					</div>
				</div>

				<Separator />

				<!-- Message Type Selection -->
				<div class="space-y-4">
					<h3 class="text-sm font-medium">Ziņojuma veids</h3>
					<Select.Root type="single" bind:value={messageType}>
						<Select.Trigger>
							{messageType === 'rich'
								? 'Formatēts ziņojums (ieteicams)'
								: messageType === 'plain'
									? 'Vienkāršs teksts'
									: 'Izvēlieties ziņojuma veidu'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="rich">Formatēts ziņojums (ieteicams)</Select.Item>
							<Select.Item value="plain">Vienkāršs teksts</Select.Item>
						</Select.Content>
					</Select.Root>

					<div class="text-muted-foreground text-sm">
						{#if messageType === 'rich'}
							Formatēti ziņojumi izmanto emocijzīmes un strukturētu izkārtojumu
						{:else}
							Vienkārši teksta ziņojumi bez formatējuma
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)}>Atcelt</Button>
			<Button onclick={shareProject} disabled={!selectedConversation || sharing}>
				{#if sharing}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Nosūta...
				{:else}
					Nosūtīt uzdevumu
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
