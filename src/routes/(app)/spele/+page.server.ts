import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { gameStats, gameAttempts, dailyWord } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, fetch }) => {
	const user = locals.user;
	if (!user) {
		return {
			userStats: null,
			hasPlayedToday: false,
			leaderboard: []
		};
	}

	try {
		// Get user's game statistics
		const userStats = await db.query.gameStats.findFirst({
			where: eq(gameStats.userId, user.id)
		});

		// Check if user has played today
		const today = new Date().toISOString().split('T')[0];
		const todaysWord = await db.query.dailyWord.findFirst({
			where: eq(dailyWord.date, today)
		});

		let hasPlayedToday = false;
		if (todaysWord) {
			const todaysAttempt = await db.query.gameAttempts.findFirst({
				where: and(eq(gameAttempts.userId, user.id), eq(gameAttempts.dailyWordId, todaysWord.id))
			});
			hasPlayedToday = !!todaysAttempt;
		}

		// Get top 10 leaderboard
		const leaderboardData = await fetch('/api/game/leaderboard?limit=10');
		const leaderboard = leaderboardData.ok ? await leaderboardData.json() : [];

		return {
			userStats,
			hasPlayedToday,
			leaderboard
		};
	} catch (error) {
		console.error('Error loading game data:', error);
		return {
			userStats: null,
			hasPlayedToday: false,
			leaderboard: []
		};
	}
};
