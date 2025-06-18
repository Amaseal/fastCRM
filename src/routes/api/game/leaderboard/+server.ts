import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { gameStats, user } from '$lib/server/db/schema';
import { desc, and, gt, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const sortBy = url.searchParams.get('sortBy') || 'winRate';
		const limit = parseInt(url.searchParams.get('limit') || '10');

		let orderBy;
		switch (sortBy) {
			case 'winRate':
				// Sort by win rate (wins/games), then by total wins
				orderBy = [desc(gameStats.totalWins), desc(gameStats.totalGames)];
				break;
			case 'currentStreak':
				orderBy = [desc(gameStats.currentStreak)];
				break;
			case 'maxStreak':
				orderBy = [desc(gameStats.maxStreak)];
				break;
			case 'bestTime':
				orderBy = [gameStats.bestTime]; // ASC for best (lowest) time
				break;
			case 'averageTime':
				orderBy = [gameStats.averageTime]; // ASC for best (lowest) average
				break;
			case 'averageGuesses':
				orderBy = [gameStats.averageGuesses]; // ASC for best (lowest) average
				break;
			default:
				orderBy = [desc(gameStats.totalWins)];
		}

		const leaderboard = await db
			.select({
				userId: gameStats.userId,
				userName: user.name,
				totalGames: gameStats.totalGames,
				totalWins: gameStats.totalWins,
				winRate: gameStats.totalWins, // We'll calculate this in the response
				averageGuesses: gameStats.averageGuesses,
				averageTime: gameStats.averageTime,
				bestTime: gameStats.bestTime,
				currentStreak: gameStats.currentStreak,
				maxStreak: gameStats.maxStreak
			})
			.from(gameStats)
			.innerJoin(user, eq(gameStats.userId, user.id))
			.where(gt(gameStats.totalGames, 0)) // Only include users who have played
			.orderBy(...orderBy)
			.limit(limit);

		// Calculate win rates and format the response
		const formattedLeaderboard = leaderboard.map((entry, index) => ({
			rank: index + 1,
			userId: entry.userId,
			userName: entry.userName,
			totalGames: entry.totalGames,
			totalWins: entry.totalWins,
			winRate: entry.totalGames > 0 ? Math.round((entry.totalWins / entry.totalGames) * 100) : 0,
			averageGuesses: entry.averageGuesses ? Math.round(entry.averageGuesses * 10) / 10 : 0,
			averageTime: entry.averageTime ? Math.round(entry.averageTime) : 0,
			bestTime: entry.bestTime,
			currentStreak: entry.currentStreak,
			maxStreak: entry.maxStreak
		}));

		return json(formattedLeaderboard);

	} catch (error) {
		console.error('Error getting leaderboard:', error);
		return json({ error: 'Failed to get leaderboard' }, { status: 500 });
	}
};
