import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tab } from '$lib/server/db/schema';
import { asc, ne, eq } from 'drizzle-orm';

export async function POST({ url }) {
	try {
		const action = url.searchParams.get('action');

		if (action === 'fix-orders') {
			// Get only visible tabs (excluding 'done')
			const visibleTabs = await db
				.select()
				.from(tab)
				.where(ne(tab.title, 'done'))
				.orderBy(asc(tab.order));

			console.log('[Fix Orders] Found visible tabs:', visibleTabs.length);

			// Reassign orders starting from 0
			const updates = [];
			for (let i = 0; i < visibleTabs.length; i++) {
				await db.update(tab).set({ order: i }).where(eq(tab.id, visibleTabs[i].id));

				updates.push({
					id: visibleTabs[i].id,
					title: visibleTabs[i].title,
					oldOrder: visibleTabs[i].order,
					newOrder: i
				});
			}

			return json({
				success: true,
				message: 'Tab orders fixed successfully',
				updates
			});
		}

		return json(
			{
				success: false,
				error: 'Invalid action. Use ?action=fix-orders'
			},
			{ status: 400 }
		);
	} catch (error) {
		console.error('[Fix Orders API] Error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}
