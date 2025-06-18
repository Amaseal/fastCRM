import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tab } from '$lib/server/db/schema';
import { asc, ne, eq } from 'drizzle-orm';

export async function POST({ url }) {
	try {
		const action = url.searchParams.get('action');
		if (action === 'fix-orders') {
			// Step 1: Fix the 'done' tab to always have order 0
			const doneTab = await db.select().from(tab).where(eq(tab.title, 'done')).limit(1);

			const updates = [];

			if (doneTab.length > 0) {
				const currentDoneOrder = doneTab[0].order;
				if (currentDoneOrder !== 0) {
					await db.update(tab).set({ order: 0 }).where(eq(tab.id, doneTab[0].id));

					updates.push({
						id: doneTab[0].id,
						title: doneTab[0].title,
						oldOrder: currentDoneOrder,
						newOrder: 0,
						type: 'done-tab'
					});

					console.log('[Fix Orders] Fixed done tab order:', currentDoneOrder, '→ 0');
				} else {
					console.log('[Fix Orders] Done tab already has correct order (0)');
				}
			} else {
				console.log('[Fix Orders] No done tab found');
			}

			// Step 2: Get only visible tabs (excluding 'done') and reorder starting from 1
			const visibleTabs = await db
				.select()
				.from(tab)
				.where(ne(tab.title, 'done'))
				.orderBy(asc(tab.order));

			console.log('[Fix Orders] Found visible tabs:', visibleTabs.length);

			// Reassign orders starting from 1 (since done tab takes 0)
			for (let i = 0; i < visibleTabs.length; i++) {
				const newOrder = i + 1; // Start from 1, not 0
				await db.update(tab).set({ order: newOrder }).where(eq(tab.id, visibleTabs[i].id));

				updates.push({
					id: visibleTabs[i].id,
					title: visibleTabs[i].title,
					oldOrder: visibleTabs[i].order,
					newOrder: newOrder,
					type: 'visible-tab'
				});
			}

			return json({
				success: true,
				message: 'Tab orders fixed successfully - done tab set to 0, visible tabs reordered from 1',
				updates,
				summary: {
					doneTabFixed: doneTab.length > 0 && doneTab[0].order !== 0,
					visibleTabsReordered: visibleTabs.length,
					finalOrderRange: `0 (done) + 1-${visibleTabs.length} (visible)`
				}
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
