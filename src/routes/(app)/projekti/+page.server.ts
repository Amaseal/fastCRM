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
}