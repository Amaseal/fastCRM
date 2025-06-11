import type { TabWithRelations, TabWithTasks, TaskWithRelations } from '$lib/types';
import type { Tag } from './db/schema';

export function groupTasksByTab(tasks: TaskWithRelations[], tabs: TabWithRelations[]): TabWithTasks[] {
    const tabMap = new Map<number, TabWithTasks>(tabs.map((t) => [t.id, { ...t, tasks: [] }]));

    tasks.forEach((task) => {
        if (task.tabId && tabMap.has(Number(task.tabId))) {
            tabMap.get(Number(task.tabId))!.tasks.push(task);
        }
    });

    return Array.from(tabMap.values());
}

// Helper function to group tabs by tags and order them by tag.order
export function groupTabsByTag(tabs: TabWithTasks[], tags: Tag[]): Record<string, TabWithTasks[]> {
    // Create a map for quick tag lookup
    const tagMap = new Map<number, Tag>();
    tags.forEach((tag) => {
        tagMap.set(tag.id, tag);
    });

    // Group tabs by their tag
    const groupedTabs: Record<string, TabWithTasks[]> = {};

    // Handle tabs without a tag first
    groupedTabs['untagged'] = tabs.filter((tab) => !tab.tagId);

    // Group the rest by their tag
    tabs
        .filter((tab) => tab.tagId)
        .forEach((tab) => {
            const tagId = tab.tagId!;
            const tagName = tagMap.get(tagId)?.tag || 'unknown';

            if (!groupedTabs[tagName]) {
                groupedTabs[tagName] = [];
            }

            groupedTabs[tagName].push(tab);
        });

    // Sort tabs within each tag group
    Object.keys(groupedTabs).forEach((tagName) => {
        if (tagName !== 'untagged') {
            groupedTabs[tagName].sort((a, b) => {
                return (a.title || '').localeCompare(b.title || '');
            });
        }
    });

    return groupedTabs;
}