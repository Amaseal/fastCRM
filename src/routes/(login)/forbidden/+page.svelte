<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { AlertTriangle, ArrowLeft } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Pieeja liegta</title>
</svelte:head>

<div class="dark:bg-background flex min-h-screen items-center justify-center bg-gray-50 px-4">
	<Card class="w-full max-w-md">
		<CardHeader class="text-center">
			<div class="mb-4 flex justify-center">
				<AlertTriangle class="h-16 w-16 text-red-500" />
			</div>
			<CardTitle class="text-2xl font-bold text-gray-900 dark:text-gray-100">
				Pieeja liegta
			</CardTitle>
			<CardDescription class="text-gray-600 dark:text-gray-400">
				Jums nav atļaujas piekļūt šim resursam
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="text-center text-sm text-gray-500 dark:text-gray-400">
				<p>Šī darbība nav atļauta.</p>
			</div>

			<div class="flex justify-center">
				<Button href="/login" variant="outline" class="w-full">
					<ArrowLeft class="mr-2 h-4 w-4" />
					Atpakaļ uz pieteikšanos
				</Button>
			</div>
		</CardContent>
	</Card>
</div>
