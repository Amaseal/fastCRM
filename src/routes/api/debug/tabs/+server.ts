import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tab } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';

export async function GET({ url }) {
	try {
		// Get all tabs with their order, including the 'done' tab
		const allTabs = await db
			.select({
				id: tab.id,
				title: tab.title,
				order: tab.order,
				createdAt: tab.created_at
			})
			.from(tab)
			.orderBy(asc(tab.order));

		// Group by visibility (done vs visible)
		const visibleTabs = allTabs.filter((t) => t.title !== 'done');
		const doneTabs = allTabs.filter((t) => t.title === 'done');

		return json({
			success: true,
			data: {
				allTabs,
				visibleTabs,
				doneTabs,
				stats: {
					totalTabs: allTabs.length,
					visibleTabsCount: visibleTabs.length,
					doneTabsCount: doneTabs.length,
					orderValues: allTabs.map((t) => t.order),
					duplicateOrders: findDuplicateOrders(allTabs)
				}
			}
		});
	} catch (error) {
		console.error('[Debug API] Error fetching tabs:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}

function findDuplicateOrders(tabs: any[]) {
	const orderCounts = new Map();
	const duplicates = [];

	tabs.forEach((tab) => {
		const count = orderCounts.get(tab.order) || 0;
		orderCounts.set(tab.order, count + 1);

		if (count === 1) {
			// First duplicate found
			duplicates.push({
				order: tab.order,
				tabs: tabs.filter((t) => t.order === tab.order)
			});
		}
	});

	return duplicates;
}
