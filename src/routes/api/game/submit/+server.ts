import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { dailyWord, gameAttempts, gameStats } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { dailyWordId, guesses, timeSpent } = await request.json();

		if (!dailyWordId || !guesses || !Array.isArray(guesses)) {
			return json({ error: 'Invalid request data' }, { status: 400 });
		}

		// Get the daily word to check the answer
		const todaysWord = await db.query.dailyWord.findFirst({
			where: eq(dailyWord.id, dailyWordId)
		});

		if (!todaysWord) {
			return json({ error: 'Invalid daily word' }, { status: 400 });
		}

		// Check if user already has an attempt for this word
		const existingAttempt = await db.query.gameAttempts.findFirst({
			where: and(eq(gameAttempts.userId, user.id), eq(gameAttempts.dailyWordId, dailyWordId))
		});

		if (existingAttempt) {
			return json({ error: 'Already attempted today' }, { status: 400 });
		}

		// Check if the game is solved (last guess matches the word)
		const lastGuess = guesses[guesses.length - 1];
		const solved = lastGuess?.toUpperCase() === todaysWord.word.toUpperCase();
		const guessCount = guesses.length;

		// Save the attempt
		await db.insert(gameAttempts).values({
			userId: user.id,
			dailyWordId,
			guesses: JSON.stringify(guesses),
			solved,
			guessCount,
			timeSpent: timeSpent || null
		});

		// Update user stats
		let stats = await db.query.gameStats.findFirst({
			where: eq(gameStats.userId, user.id)
		});

		if (!stats) {
			// Create initial stats
			await db.insert(gameStats).values({
				userId: user.id,
				totalGames: 1,
				totalWins: solved ? 1 : 0,
				averageGuesses: solved ? guessCount : 0,
				averageTime: timeSpent || 0,
				bestTime: solved && timeSpent ? timeSpent : null,
				currentStreak: solved ? 1 : 0,
				maxStreak: solved ? 1 : 0
			});
		} else {
			// Update existing stats
			const newTotalGames = stats.totalGames + 1;
			const newTotalWins = stats.totalWins + (solved ? 1 : 0);
			const newCurrentStreak = solved ? stats.currentStreak + 1 : 0;
			const newMaxStreak = Math.max(stats.maxStreak, newCurrentStreak);

			// Calculate new averages (only for solved games)
			let newAverageGuesses = stats.averageGuesses || 0;
			let newAverageTime = stats.averageTime || 0;
			let newBestTime = stats.bestTime;

			if (solved) {
				newAverageGuesses =
					((stats.averageGuesses || 0) * stats.totalWins + guessCount) / newTotalWins;
				if (timeSpent) {
					newAverageTime = ((stats.averageTime || 0) * stats.totalWins + timeSpent) / newTotalWins;
					newBestTime = !stats.bestTime ? timeSpent : Math.min(stats.bestTime, timeSpent);
				}
			}

			await db
				.update(gameStats)
				.set({
					totalGames: newTotalGames,
					totalWins: newTotalWins,
					averageGuesses: newAverageGuesses,
					averageTime: newAverageTime,
					bestTime: newBestTime,
					currentStreak: newCurrentStreak,
					maxStreak: newMaxStreak
				})
				.where(eq(gameStats.userId, user.id));
		}

		// Return feedback for each guess
		const feedback = guesses.map((guess: string) => {
			return evaluateGuess(guess.toUpperCase(), todaysWord.word.toUpperCase());
		});

		return json({
			solved,
			feedback,
			word: solved ? todaysWord.word : undefined, // Only reveal word if solved
			attempts: guessCount
		});
	} catch (error) {
		console.error('Error submitting game attempt:', error);
		return json({ error: 'Failed to submit attempt' }, { status: 500 });
	}
};

function evaluateGuess(guess: string, word: string): ('correct' | 'present' | 'absent')[] {
	const result: ('correct' | 'present' | 'absent')[] = [];
	const wordArray = word.split('');
	const guessArray = guess.split('');
	const usedWordIndices: boolean[] = new Array(wordArray.length).fill(false);
	const processedGuessIndices: boolean[] = new Array(guessArray.length).fill(false);

	// First pass: mark correct letters
	for (let i = 0; i < guessArray.length; i++) {
		if (guessArray[i] === wordArray[i]) {
			result[i] = 'correct';
			usedWordIndices[i] = true;
			processedGuessIndices[i] = true;
		}
	}

	// Second pass: mark present letters
	for (let i = 0; i < guessArray.length; i++) {
		if (!processedGuessIndices[i]) {
			const letterIndex = wordArray.findIndex(
				(letter, index) => letter === guessArray[i] && !usedWordIndices[index]
			);
			if (letterIndex !== -1) {
				result[i] = 'present';
				usedWordIndices[letterIndex] = true;
			} else {
				result[i] = 'absent';
			}
		}
	}

	return result;
}
