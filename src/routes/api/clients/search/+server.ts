import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';
import { like, asc } from 'drizzle-orm';
import { client } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q') || '';

	// Only search if query is at least 1 character
	if (query.length === 0) {
		return json([]);
	}

	try {
		const clients = await db.query.client.findMany({
			where: like(client.name, `%${query}%`),
			orderBy: [asc(client.name)],
			limit: 20 // Limit results to keep it fast
		});

		return json(clients);
	} catch (error) {
		console.error('Error searching clients:', error);
		return json([], { status: 500 });
	}
};
