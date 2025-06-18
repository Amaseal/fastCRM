import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { gameAttempts, dailyWord } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTodaysDate } from '$lib/server/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	try {
		const todayStr = getTodaysDate();
		// Get today's word
		const todaysWord = await db.query.dailyWord.findFirst({
			where: eq(dailyWord.date, todayStr)
		});

		if (!todaysWord) {
			return json({
				hasPlayedToday: false,
				canPlay: true
			});
		}

		// Check if user has attempted today
		const todaysAttempt = await db.query.gameAttempts.findFirst({
			where: and(eq(gameAttempts.userId, user.id), eq(gameAttempts.dailyWordId, todaysWord.id))
		});

		return json({
			hasPlayedToday: !!todaysAttempt,
			canPlay: !todaysAttempt,
			solved: todaysAttempt?.solved || false,
			attempts: todaysAttempt?.guessCount || 0
		});
	} catch (error) {
		console.error('Error checking game status:', error);
		return json({ error: 'Failed to check status' }, { status: 500 });
	}
};
