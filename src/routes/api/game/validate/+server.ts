import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { dailyWord } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { dailyWordId, guess } = await request.json();

		if (!dailyWordId || !guess || typeof guess !== 'string') {
			return json({ error: 'Invalid request data' }, { status: 400 });
		}

		// Get the daily word to check the answer
		const todaysWord = await db.query.dailyWord.findFirst({
			where: eq(dailyWord.id, dailyWordId)
		});

		if (!todaysWord) {
			return json({ error: 'Invalid daily word' }, { status: 400 });
		}

		// Evaluate the guess
		const feedback = evaluateGuess(guess.toUpperCase(), todaysWord.word.toUpperCase());
		const isCorrect = guess.toUpperCase() === todaysWord.word.toUpperCase();

		return json({
			feedback,
			isCorrect,
			word: isCorrect ? todaysWord.word : undefined // Only reveal word if correct
		});
	} catch (error) {
		console.error('Error validating guess:', error);
		return json({ error: 'Failed to validate guess' }, { status: 500 });
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
