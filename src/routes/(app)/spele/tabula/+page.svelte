<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Trophy, Medal, Award, Clock, Target, TrendingUp } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const sortOptions = [
		{ value: 'winRate', label: 'Uzvaras procents' },
		{ value: 'currentStreak', label: 'Pašreizējā sērija' },
		{ value: 'maxStreak', label: 'Labākā sērija' },
		{ value: 'bestTime', label: 'Labākais laiks' },
		{ value: 'averageTime', label: 'Vidējais laiks' },
		{ value: 'averageGuesses', label: 'Vidējie minējumi' }
	];
	function handleSortChange(value: string | undefined) {
		if (value) {
			const url = new URL($page.url);
			url.searchParams.set('sortBy', value);
			goto(url.toString());
		}
	}

	function getRankIcon(rank: number) {
		switch (rank) {
			case 1:
				return { icon: Trophy, class: 'text-yellow-500' };
			case 2:
				return { icon: Medal, class: 'text-gray-400' };
			case 3:
				return { icon: Award, class: 'text-amber-600' };
			default:
				return null;
		}
	}

	function formatTime(seconds: number | null): string {
		if (!seconds) return '-';
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	function getSortDescription(sortBy: string): string {
		switch (sortBy) {
			case 'winRate':
				return 'Kārtots pēc uzvaras procenta';
			case 'currentStreak':
				return 'Kārtots pēc pašreizējās uzvaras sērijas';
			case 'maxStreak':
				return 'Kārtots pēc labākās uzvaras sērijas';
			case 'bestTime':
				return 'Kārtots pēc labākā laika (mazāks ir labāks)';
			case 'averageTime':
				return 'Kārtots pēc vidējā laika (mazāks ir labāks)';
			case 'averageGuesses':
				return 'Kārtots pēc vidējo minējumu skaita (mazāks ir labāks)';
			default:
				return '';
		}
	}
</script>

<svelte:head>
	<title>Līderu tabula</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="mb-2 text-4xl font-bold">Līderu tabula</h1>
			<p class="text-gray-600">{getSortDescription(data.sortBy)}</p>
		</div>
		<Button href="/spele" variant="outline">Atpakaļ uz spēli</Button>
	</div>

	<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
		<!-- Sort Controls -->
		<Card class="lg:col-span-1">
			<CardHeader>
				<CardTitle>Kārtošana</CardTitle>
			</CardHeader>
			<CardContent>
				<Select.Root type="single">
					<Select.Trigger>
						{sortOptions.find((o) => o.value === data.sortBy)?.label || 'Izvēlieties kārtošanu'}
					</Select.Trigger>
					<Select.Content>
						{#each sortOptions as option}
							<Select.Item value={option.value} onclick={() => handleSortChange(option.value)}
								>{option.label}</Select.Item
							>
						{/each}
					</Select.Content>
				</Select.Root>
			</CardContent>
		</Card>
		<!-- Top 3 Highlights -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:col-span-3">
			{#each data.leaderboard.slice(0, 3) as player, index}
				<Card class="relative">
					{#if player.rank === 1}
						<div class="absolute -top-2 -right-2">
							<div class="rounded-full border bg-white p-2 shadow-lg">
								<Trophy class="h-6 w-6 text-yellow-500" />
							</div>
						</div>
					{:else if player.rank === 2}
						<div class="absolute -top-2 -right-2">
							<div class="rounded-full border bg-white p-2 shadow-lg">
								<Medal class="h-6 w-6 text-gray-400" />
							</div>
						</div>
					{:else if player.rank === 3}
						<div class="absolute -top-2 -right-2">
							<div class="rounded-full border bg-white p-2 shadow-lg">
								<Award class="h-6 w-6 text-amber-600" />
							</div>
						</div>
					{/if}
					<CardHeader class="text-center">
						<CardTitle class="text-lg">{player.userName}</CardTitle>
						<CardDescription>#{player.rank} vieta</CardDescription>
					</CardHeader>
					<CardContent class="space-y-2 text-center">
						<div class="text-2xl font-bold">{player.winRate}%</div>
						<div class="text-sm text-gray-600">Uzvaras procents</div>
						<div class="text-sm">
							{player.totalWins}/{player.totalGames} spēles
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	</div>

	<!-- Full Leaderboard Table -->
	<Card>
		<CardHeader>
			<CardTitle>Pilna tabula</CardTitle>
			<CardDescription
				>Visi spēlētāji, kārtoti pēc {sortOptions
					.find((o) => o.value === data.sortBy)
					?.label.toLowerCase()}</CardDescription
			>
		</CardHeader>
		<CardContent>
			{#if data.leaderboard.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b">
								<th class="p-3 text-left">Vieta</th>
								<th class="p-3 text-left">Spēlētājs</th>
								<th class="p-3 text-center">Spēles</th>
								<th class="p-3 text-center">Uzvaras</th>
								<th class="p-3 text-center">Uzv. %</th>
								<th class="p-3 text-center">Pašr. sērija</th>
								<th class="p-3 text-center">Lab. sērija</th>
								<th class="p-3 text-center">Vid. minēj.</th>
								<th class="p-3 text-center">Vid. laiks</th>
								<th class="p-3 text-center">Lab. laiks</th>
							</tr>
						</thead>
						<tbody>
							{#each data.leaderboard as player}
								<tr class="border-b hover:bg-gray-50">
									<td class="p-3">
										<div class="flex items-center gap-2">
											{#if player.rank === 1}
												<Trophy class="h-4 w-4 text-yellow-500" />
											{:else if player.rank === 2}
												<Medal class="h-4 w-4 text-gray-400" />
											{:else if player.rank === 3}
												<Award class="h-4 w-4 text-amber-600" />
											{/if}
											#{player.rank}
										</div>
									</td>
									<td class="p-3 font-medium">{player.userName}</td>
									<td class="p-3 text-center">{player.totalGames}</td>
									<td class="p-3 text-center">{player.totalWins}</td>
									<td class="p-3 text-center">
										<Badge
											variant={player.winRate >= 80
												? 'default'
												: player.winRate >= 60
													? 'secondary'
													: 'outline'}
										>
											{player.winRate}%
										</Badge>
									</td>
									<td class="p-3 text-center">{player.currentStreak}</td>
									<td class="p-3 text-center">{player.maxStreak}</td>
									<td class="p-3 text-center">
										{player.averageGuesses > 0 ? player.averageGuesses : '-'}
									</td>
									<td class="p-3 text-center">{formatTime(player.averageTime)}</td>
									<td class="p-3 text-center">{formatTime(player.bestTime)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="py-8 text-center">
					<p class="text-gray-600">Nav spēlētāju datu</p>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Statistics Summary -->
	<div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Target class="h-5 w-5" />
					Kopējā statistika
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-2">
					<div class="flex justify-between">
						<span>Aktīvi spēlētāji:</span>
						<span class="font-medium">{data.leaderboard.length}</span>
					</div>
					<div class="flex justify-between">
						<span>Kopējās spēles:</span>
						<span class="font-medium">
							{data.leaderboard.reduce((sum: number, p: any) => sum + p.totalGames, 0)}
						</span>
					</div>
					<div class="flex justify-between">
						<span>Vidējā uzvaras %:</span>
						<span class="font-medium">
							{data.leaderboard.length > 0
								? Math.round(
										data.leaderboard.reduce((sum: number, p: any) => sum + p.winRate, 0) /
											data.leaderboard.length
									)
								: 0}%
						</span>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Clock class="h-5 w-5" />
					Laika rekordi
				</CardTitle>
			</CardHeader>
			<CardContent>
				{@const bestTimePlayer = data.leaderboard.find((p: any) => p.bestTime)}
				{#if bestTimePlayer}
					<div class="space-y-2">
						<div class="text-center">
							<div class="text-2xl font-bold">{formatTime(bestTimePlayer.bestTime)}</div>
							<div class="text-sm text-gray-600">Labākais laiks</div>
							<div class="text-sm font-medium">{bestTimePlayer.userName}</div>
						</div>
					</div>
				{:else}
					<p class="text-center text-gray-600">Nav laika datu</p>
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<TrendingUp class="h-5 w-5" />
					Sēriju rekordi
				</CardTitle>
			</CardHeader>
			<CardContent>
				{@const bestStreakPlayer = data.leaderboard.reduce(
					(best: any, current: any) =>
						current.maxStreak > (best?.maxStreak || 0) ? current : best,
					null
				)}
				{#if bestStreakPlayer}
					<div class="space-y-2">
						<div class="text-center">
							<div class="text-2xl font-bold">{bestStreakPlayer.maxStreak}</div>
							<div class="text-sm text-gray-600">Labākā sērija</div>
							<div class="text-sm font-medium">{bestStreakPlayer.userName}</div>
						</div>
					</div>
				{:else}
					<p class="text-center text-gray-600">Nav sēriju datu</p>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
