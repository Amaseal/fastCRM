import type { TabWithRelations, TabWithTasks, TaskWithRelations } from '$lib/types';


export function groupTasksByTab(tasks: TaskWithRelations[], tabs: TabWithRelations[]): TabWithTasks[] {
    const tabMap = new Map<number, TabWithTasks>(tabs.map((t) => [t.id, { ...t, tasks: [] }]));

    tasks.forEach((task) => {
        if (task.tabId && tabMap.has(Number(task.tabId))) {
            tabMap.get(Number(task.tabId))!.tasks.push(task);
        }
    });

    return Array.from(tabMap.values());
}