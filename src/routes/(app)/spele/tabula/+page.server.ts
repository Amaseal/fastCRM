import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const sortBy = url.searchParams.get('sortBy') || 'winRate';
	const limit = parseInt(url.searchParams.get('limit') || '50');

	try {
		const response = await fetch(`/api/game/leaderboard?sortBy=${sortBy}&limit=${limit}`);
		const leaderboard = response.ok ? await response.json() : [];

		return {
			leaderboard,
			sortBy,
			limit
		};
	} catch (error) {
		console.error('Error loading leaderboard:', error);
		return {
			leaderboard: [],
			sortBy,
			limit
		};
	}
};
