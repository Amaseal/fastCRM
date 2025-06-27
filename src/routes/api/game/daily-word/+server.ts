import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { dailyWord } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getTodaysDate } from '$lib/server/utils';
import type { RequestHandler } from './$types';
import rawWords from './latvian_5_letter_words.json';

// Load 5-letter Latvian words from JSON file
const WORD_LIST = rawWords.map(word => word.toUpperCase());

function getWordForDate(date: string): string {
	// Use a simple hash of the date to get a consistent word for each day
	const hash = date.split('').reduce((a, b) => {
		a = (a << 5) - a + b.charCodeAt(0);
		return a & a;
	}, 0);
	const index = Math.abs(hash) % WORD_LIST.length;
	return WORD_LIST[index];
}

export const GET: RequestHandler = async () => {
	try {
		const today = getTodaysDate();

		// Check if we already have a word for today
		let todaysWord = await db.query.dailyWord.findFirst({
			where: eq(dailyWord.date, today)
		});

		// If no word exists for today, create one
		if (!todaysWord) {
			const word = getWordForDate(today);
			const [newWord] = await db
				.insert(dailyWord)
				.values({
					word,
					date: today
				})
				.returning();
			todaysWord = newWord;
		}

		return json({
			id: todaysWord.id,
			date: todaysWord.date,
			// Don't return the actual word to the client!
			wordLength: todaysWord.word.length
		});
	} catch (error) {
		console.error('Error getting daily word:', error);
		return json({ error: 'Failed to get daily word' }, { status: 500 });
	}
};
