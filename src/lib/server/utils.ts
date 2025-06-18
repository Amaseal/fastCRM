import type { TabWithRelations, TabWithTasks, TaskWithRelations } from '$lib/types';

/**
 * Get today's date in YYYY-MM-DD format using local timezone
 * This ensures consistency across all game API routes
 */
export function getTodaysDate(): string {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const day = String(today.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function groupTasksByTab(
	tasks: TaskWithRelations[],
	tabs: TabWithRelations[]
): TabWithTasks[] {
	const tabMap = new Map<number, TabWithTasks>(tabs.map((t) => [t.id, { ...t, tasks: [] }]));

	tasks.forEach((task) => {
		if (task.tabId && tabMap.has(Number(task.tabId))) {
			tabMap.get(Number(task.tabId))!.tasks.push(task);
		}
	});

	return Array.from(tabMap.values());
}
