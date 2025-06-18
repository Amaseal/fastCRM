<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Trophy, Clock, Target, Zap, TrendingUp } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Game state
	let currentGuess = $state('');
	let guesses = $state<string[]>([]);
	let feedback = $state<('correct' | 'present' | 'absent')[][]>([]);
	let gameStartTime = $state<number | null>(null);
	let gameOver = $state(false);
	let won = $state(false);
	let dailyWordId = $state<number | null>(null);
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let showStats = $state(false);

	const MAX_GUESSES = 6;
	const WORD_LENGTH = 5;

	onMount(async () => {
		if (data.hasPlayedToday) {
			gameOver = true;
			return;
		}

		// Get today's word info
		try {
			const response = await fetch('/api/game/daily-word');
			if (response.ok) {
				const wordData = await response.json();
				dailyWordId = wordData.id;
				gameStartTime = Date.now();
			}
		} catch (error) {
			console.error('Error fetching daily word:', error);
			errorMessage = 'Neizdevās ielādēt šodienas vārdu';
		}
	});
	function handleKeydown(event: KeyboardEvent) {
		if (gameOver) return;

		if (event.key === 'Enter') {
			event.preventDefault();
			submitGuess();
		}
		// Remove duplicate character handling since Input component handles it
		// Only handle special keys here
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		let value = target.value.toUpperCase().replace(/[^A-Z]/g, '');
		if (value.length > WORD_LENGTH) {
			value = value.slice(0, WORD_LENGTH);
		}
		currentGuess = value;
	}
	async function submitGuess() {
		if (currentGuess.length !== WORD_LENGTH || isSubmitting || gameOver) return;

		isSubmitting = true;
		errorMessage = '';

		try {
			// Validate the guess with the server
			const response = await fetch('/api/game/validate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					dailyWordId,
					guess: currentGuess
				})
			});

			const result = await response.json();

			if (!response.ok) {
				errorMessage = result.error || 'Kļūda validējot minējumu';
				return;
			} // Update local game state
			guesses = [...guesses, currentGuess];
			feedback = [...feedback, result.feedback];
			currentGuess = '';

			const isWon = result.isCorrect;
			const isGameOver = isWon || guesses.length >= MAX_GUESSES;

			// If game is over, submit the complete game
			if (isGameOver) {
				await submitCompleteGame(isWon);
			}
		} catch (error) {
			console.error('Error submitting guess:', error);
			errorMessage = 'Neizdevās iesniegt minējumu';
		} finally {
			isSubmitting = false;
		}
	}

	async function submitCompleteGame(isWon: boolean) {
		try {
			const timeSpent = gameStartTime ? Math.round((Date.now() - gameStartTime) / 1000) : null;

			const response = await fetch('/api/game/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					dailyWordId,
					guesses: guesses,
					timeSpent
				})
			});

			const result = await response.json();

			if (!response.ok) {
				errorMessage = result.error || 'Kļūda saglabājot spēli';
				return;
			}

			// Game is complete
			gameOver = true;
			won = isWon;
			showStats = true;

			// Refresh page data to update stats
			setTimeout(() => {
				window.location.reload();
			}, 3000);
		} catch (error) {
			console.error('Error submitting complete game:', error);
			errorMessage = 'Neizdevās saglabāt spēles rezultātu';
		}
	}

	function getCellClass(rowIndex: number, colIndex: number): string {
		const baseClass =
			'w-12 h-12 border-2 border-gray-300 flex items-center justify-center text-lg font-bold uppercase';

		if (rowIndex >= guesses.length) {
			return `${baseClass} bg-white`;
		}

		if (rowIndex === guesses.length && colIndex < currentGuess.length) {
			return `${baseClass} bg-gray-100 border-gray-400`;
		}

		if (feedback[rowIndex] && feedback[rowIndex][colIndex]) {
			const status = feedback[rowIndex][colIndex];
			switch (status) {
				case 'correct':
					return `${baseClass} bg-green-500 text-white border-green-500`;
				case 'present':
					return `${baseClass} bg-yellow-500 text-white border-yellow-500`;
				case 'absent':
					return `${baseClass} bg-gray-500 text-white border-gray-500`;
			}
		}

		return `${baseClass} bg-gray-100`;
	}

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

<svelte:head>
	<title>Wordle</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<div class="container mx-auto px-4 py-8">
	<div class="mb-8 text-center">
		<h1 class="mb-2 text-4xl font-bold">Vārdu Spēle</h1>
		<p class="text-gray-600">Uzminiet 5 burtu vārdu 6 mēģinājumos!</p>
	</div>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<!-- Game Board -->
		<div class="lg:col-span-2">
			<Card>
				<CardHeader>
					<CardTitle>Šodienas izaicinājums</CardTitle>
					{#if data.hasPlayedToday}
						<CardDescription>Jūs jau esat spēlējis šodien! Atgriezieties rīt.</CardDescription>
					{:else}
						<CardDescription>Minējumi: {guesses.length}/{MAX_GUESSES}</CardDescription>
					{/if}
				</CardHeader>
				<CardContent>
					{#if data.hasPlayedToday}
						<div class="py-8 text-center">
							<p class="mb-4 text-lg">Spēle pabeigta šodien!</p>
							<Button onclick={() => (showStats = !showStats)}>
								{showStats ? 'Paslēpt' : 'Rādīt'} statistiku
							</Button>
						</div>
					{:else}
						<!-- Game Grid -->
						<div class="mb-6 flex flex-col gap-2">
							{#each Array(MAX_GUESSES) as _, rowIndex}
								<div class="flex justify-center gap-2">
									{#each Array(WORD_LENGTH) as _, colIndex}
										<div class={getCellClass(rowIndex, colIndex)}>
											{#if rowIndex < guesses.length}
												{guesses[rowIndex][colIndex] || ''}
											{:else if rowIndex === guesses.length}
												{currentGuess[colIndex] || ''}
											{/if}
										</div>
									{/each}
								</div>
							{/each}
						</div>
						<!-- Input and Submit -->
						{#if !gameOver}
							<div class="flex justify-center gap-2">
								<Input
									bind:value={currentGuess}
									oninput={handleInput}
									placeholder="Ievadiet vārdu..."
									maxlength={WORD_LENGTH}
									class="w-48 text-center uppercase"
									disabled={isSubmitting}
								/>
								<Button
									onclick={submitGuess}
									disabled={currentGuess.length !== WORD_LENGTH || isSubmitting}
								>
									{isSubmitting ? 'Iesniedz...' : 'Iesniegt'}
								</Button>
							</div>
						{/if}

						{#if errorMessage}
							<p class="mt-4 text-center text-red-500">{errorMessage}</p>
						{/if}

						{#if gameOver}
							<div class="mt-6 text-center">
								{#if won}
									<p class="mb-2 text-xl font-bold text-green-600">🎉 Apsveicu! Jūs uzminējāt!</p>
								{:else}
									<p class="mb-2 text-xl font-bold text-red-600">😞 Diemžēl neizdeva šoreiz</p>
								{/if}
								<Button onclick={() => (showStats = !showStats)}>Rādīt statistiku</Button>
							</div>
						{/if}
					{/if}
				</CardContent>
			</Card>
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- User Stats -->
			{#if data.userStats && showStats}
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Target class="h-5 w-5" />
							Jūsu statistika
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="grid grid-cols-2 gap-4">
							<div class="text-center">
								<div class="text-2xl font-bold">{data.userStats.totalGames}</div>
								<div class="text-sm text-gray-600">Spēles</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold">
									{data.userStats.totalGames > 0
										? Math.round((data.userStats.totalWins / data.userStats.totalGames) * 100)
										: 0}%
								</div>
								<div class="text-sm text-gray-600">Uzvaras</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold">{data.userStats.currentStreak}</div>
								<div class="text-sm text-gray-600">Sērija</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold">{data.userStats.maxStreak}</div>
								<div class="text-sm text-gray-600">Labākā sērija</div>
							</div>
						</div>
						{#if data.userStats.averageGuesses && data.userStats.averageGuesses > 0}
							<Separator />
							<div class="space-y-2">
								<div class="flex justify-between">
									<span>Vidējie minējumi:</span>
									<span>{Math.round(data.userStats.averageGuesses * 10) / 10}</span>
								</div>
								{#if data.userStats.averageTime && data.userStats.averageTime > 0}
									<div class="flex justify-between">
										<span>Vidējais laiks:</span>
										<span>{formatTime(Math.round(data.userStats.averageTime))}</span>
									</div>
								{/if}
								{#if data.userStats.bestTime}
									<div class="flex justify-between">
										<span>Labākais laiks:</span>
										<span>{formatTime(data.userStats.bestTime)}</span>
									</div>
								{/if}
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}

			<!-- Leaderboard -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Trophy class="h-5 w-5" />
						Līderu tabula
					</CardTitle>
					<CardDescription class="flex items-center justify-between">
						<span>Top spēlētāji</span>
						<Button href="/spele/tabula" variant="ghost" size="sm">Skatīt visu</Button>
					</CardDescription>
				</CardHeader>
				<CardContent>
					{#if data.leaderboard.length > 0}
						<div class="space-y-3">
							{#each data.leaderboard.slice(0, 5) as player, index}
								<div class="flex items-center gap-3">
									<div
										class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
									>
										{player.rank}
									</div>
									<div class="flex-1">
										<div class="font-medium">{player.userName}</div>
										<div class="text-sm text-gray-600">
											{player.winRate}% uzvaras ({player.totalWins}/{player.totalGames})
										</div>
									</div>
									{#if index === 0}
										<Badge variant="secondary" class="bg-yellow-100 text-yellow-800">👑</Badge>
									{/if}
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-center text-gray-600">Nav spēlētāju datu</p>
					{/if}
				</CardContent>
			</Card>

			<!-- Game Rules -->
			<Card>
				<CardHeader>
					<CardTitle>Kā spēlēt</CardTitle>
				</CardHeader>
				<CardContent class="space-y-2 text-sm">
					<p>• Uzminiet 5 burtu vārdu 6 mēģinājumos</p>
					<p>• Zaļš - burts ir pareizajā vietā</p>
					<p>• Dzeltens - burts ir vārdā, bet nepareizajā vietā</p>
					<p>• Pelēks - burta nav vārdā</p>
					<p>• Katru dienu jauns vārds!</p>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
