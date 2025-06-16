import { type Actions } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { task, tab, client, user, material, product, file, taskMaterial, taskProduct } from '$lib/server/db/schema';
import { asc, desc, eq, and, like, or, sql, inArray, count, ne } from 'drizzle-orm';
import { superValidate, fail, message, type SuperValidated } from 'sveltekit-superforms';
import {  taskSchema } from './schema';
import { z } from 'zod';


export const actions = {
	editCategory: async ({ request}) => {
		try {
			// Parse form data
			const formData = await request.formData();
			const draggedItemRaw = formData.get('draggedItem');
			const sourceTabId = formData.get('sourceContainer') as string;
			const targetTabId = formData.get('targetContainer') as string;

			// Validate input
			if (!draggedItemRaw || !sourceTabId || !targetTabId) {
				return fail(400, { message: 'Missing required values' });
			}

			const draggedItem = JSON.parse(draggedItemRaw as string);
			const taskId = draggedItem?.id;

			if (!taskId) {
				return fail(400, { message: 'Invalid dragged item' });
			}

			// If source and target are the same, do nothing
			if (sourceTabId === targetTabId) {
				return { success: true, message: 'No changes needed' };
			}

			// Update task's tab field to the new tab
			await db
				.update(task)
				.set({ tabId: parseInt(targetTabId, 10) })
				.where(eq(task.id, Number(taskId)));

			return { success: true, message: 'Task moved successfully' };
		} catch (error) {
			console.error('Error updating task category:', error);
			return fail(500, { message: 'Internal server error' });
		}
	},
	reorderTabs: async ({ request }) => {
		try {
			// Parse form data
			const formData = await request.formData();
			const draggedTabRaw = formData.get('draggedTab');
			const targetIndexRaw = formData.get('targetIndex');

			// Validate input
			if (!draggedTabRaw || !targetIndexRaw) {
				return fail(400, { message: 'Missing required values' });
			}

			const draggedTab = JSON.parse(draggedTabRaw as string);
			const targetIndex = parseInt(targetIndexRaw as string, 10);
			const draggedTabId = draggedTab?.id;

			if (!draggedTabId || isNaN(targetIndex)) {
				return fail(400, { message: 'Invalid dragged tab or target index' });
			}

			// Get all tabs ordered by current order
			const allTabs = await db.select().from(tab).orderBy(asc(tab.order));

			// Find the dragged tab's current position
			const draggedTabIndex = allTabs.findIndex(t => t.id === Number(draggedTabId));
			
			if (draggedTabIndex === -1) {
				return fail(400, { message: 'Dragged tab not found' });
			}

			// If target index is the same as current, do nothing
			if (draggedTabIndex === targetIndex) {
				return { success: true, message: 'No changes needed' };
			}

			// Remove the dragged tab from the array
			const [removedTab] = allTabs.splice(draggedTabIndex, 1);
			
			// Insert it at the target position
			allTabs.splice(targetIndex, 0, removedTab);

			// Update the order for all tabs
			for (let i = 0; i < allTabs.length; i++) {
				await db
					.update(tab)
					.set({ order: i })
					.where(eq(tab.id, allTabs[i].id));
			}

			return { success: true, message: 'Tabs reordered successfully' };
		} catch (error) {
			console.error('Error reordering tabs:', error);
			return fail(500, { message: 'Internal server error' });
		}
	}
} satisfies Actions;