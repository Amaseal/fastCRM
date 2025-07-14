import { type Actions } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	task,
	tab,
	client,
	user,
	material,
	product,
	file,
	taskMaterial,
	taskProduct
} from '$lib/server/db/schema';
import { asc, desc, eq, and, like, or, sql, inArray, count, ne } from 'drizzle-orm';
import { superValidate, fail, message, type SuperValidated } from 'sveltekit-superforms';
import { taskSchema } from './schema';
import { z } from 'zod';
import { redirect, setFlash } from 'sveltekit-flash-message/server';
import { createTaskNotifications, getTabTitle } from '$lib/server/notifications';

export const actions = {
	editCategory: async ({ request, cookies, locals }) => {
		try {
			// Parse form data
			const formData = await request.formData();
			const draggedItemRaw = formData.get('draggedItem');
			const sourceTabId = formData.get('sourceContainer') as string;
			const targetTabId = formData.get('targetContainer') as string;

			// Validate input
			if (!draggedItemRaw || !sourceTabId || !targetTabId) {
				console.error('[editCategory] Missing required values:', {
					draggedItemRaw: !!draggedItemRaw,
					sourceTabId: !!sourceTabId,
					targetTabId: !!targetTabId
				});
				setFlash({ type: 'error', message: 'Nav norādītas visas nepieciešamās vērtības' }, cookies);
				return fail(400, { message: 'Missing required values' });
			}

			let draggedItem;
			try {
				draggedItem = JSON.parse(draggedItemRaw as string);
			} catch (parseError) {
				console.error('[editCategory] Failed to parse dragged item:', parseError);
				setFlash({ type: 'error', message: 'Neizdevās apstrādāt pārvietojamo uzdevumu' }, cookies);
				return fail(400, { message: 'Invalid JSON for dragged item' });
			}

			const taskId = draggedItem?.id;

			if (!taskId) {
				console.error('[editCategory] Invalid dragged item - no ID:', draggedItem);
				setFlash({ type: 'error', message: 'Nederīgs pārvietojamais uzdevums' }, cookies);
				return fail(400, { message: 'Invalid dragged item' });
			}

			// If source and target are the same, do nothing
			if (sourceTabId === targetTabId) {
				console.log('[editCategory] Source and target tabs are the same, no action needed');
				return { success: true, message: 'No changes needed' };
			}			// Get task details for notifications
			const taskDetails = await db.query.task.findFirst({
				where: eq(task.id, Number(taskId)),
				columns: {
					title: true,
					managerId: true,
					responsiblePersonId: true
				}
			});

			// Update task's tab field to the new tab
			const updateResult = await db
				.update(task)
				.set({ tabId: parseInt(targetTabId, 10) })
				.where(eq(task.id, Number(taskId)));

			// Get tab titles for notification message
			const [fromTabTitle, toTabTitle] = await Promise.all([
				getTabTitle(parseInt(sourceTabId, 10)),
				getTabTitle(parseInt(targetTabId, 10))
			]);

			// Create notifications for task movement
			if (taskDetails && locals.user) {
				await createTaskNotifications({
					currentUserId: locals.user.id,
					taskId: Number(taskId),
					managerId: taskDetails.managerId,
					responsiblePersonId: taskDetails.responsiblePersonId,
					actionType: 'moved',
					fromTabTitle: fromTabTitle || 'Nezināms',
					toTabTitle: toTabTitle || 'Nezināms',
					taskTitle: taskDetails.title
				});
			}

			setFlash({ type: 'success', message: 'Uzdevums veiksmīgi pārvietots' }, cookies);
			return { success: true, message: 'Task moved successfully' };
		} catch (error) {
			setFlash(
				{ type: 'error', message: 'Radās neparedzēta kļūda uzdevuma pārvietošanas laikā' },
				cookies
			);
			return fail(500, { message: 'Internal server error' });
		}
	},
	reorderTabs: async ({ request, cookies }) => {
		console.log('[reorderTabs] Action started');

		try {
			// Parse form data
			const formData = await request.formData();
			const draggedTabRaw = formData.get('draggedTab');
			const targetIndexRaw = formData.get('targetIndex');

			// Validate input
			if (!draggedTabRaw || !targetIndexRaw) {
				console.error('[reorderTabs] Missing required values:', {
					draggedTabRaw: !!draggedTabRaw,
					targetIndexRaw: !!targetIndexRaw
				});
				setFlash(
					{
						type: 'error',
						message: 'Nav norādītas visas nepieciešamās vērtības sarakstu pārkārtošanai'
					},
					cookies
				);
				return fail(400, { message: 'Missing required values' });
			}

			let draggedTab;
			try {
				draggedTab = JSON.parse(draggedTabRaw as string);
			} catch (parseError) {
				console.error('[reorderTabs] Failed to parse dragged tab:', parseError);
				setFlash({ type: 'error', message: 'Neizdevās apstrādāt pārvietojamo sarakstu' }, cookies);
				return fail(400, { message: 'Invalid JSON for dragged tab' });
			}

			const targetIndex = parseInt(targetIndexRaw as string, 10);
			const draggedTabId = draggedTab?.id;

			if (!draggedTabId || isNaN(targetIndex)) {
				console.error('[reorderTabs] Invalid data:', {
					draggedTabId,
					targetIndex,
					isNaN: isNaN(targetIndex)
				});
				setFlash({ type: 'error', message: 'Nederīgs saraksts vai mērķa pozīcija' }, cookies);
				return fail(400, { message: 'Invalid dragged tab or target index' });
			}

			// Get only visible tabs (excluding 'done' tab) ordered by current order - same filter as in load function
			const allTabs = await db
				.select()
				.from(tab)
				.where(ne(tab.title, 'done'))
				.orderBy(asc(tab.order));

			// Validate that the target index is within bounds
			if (targetIndex < 0 || targetIndex >= allTabs.length) {
				console.error('[reorderTabs] Target index out of bounds:', {
					targetIndex,
					tabCount: allTabs.length
				});
				setFlash({ type: 'error', message: 'Nederīga mērķa pozīcija' }, cookies);
				return fail(400, { message: 'Target index out of bounds' });
			} // Find the dragged tab and the target tab
			const draggedTabRecord = allTabs.find((t) => t.id === Number(draggedTabId));
			const targetTab = allTabs[targetIndex];

			if (!draggedTabRecord) {
				console.error('[reorderTabs] Dragged tab not found in database:', draggedTabId);
				setFlash({ type: 'error', message: 'Pārvietojamais saraksts nav atrasts' }, cookies);
				return fail(400, { message: 'Dragged tab not found' });
			}

			if (!targetTab) {
				console.error('[reorderTabs] Target tab not found at index:', targetIndex);
				setFlash({ type: 'error', message: 'Mērķa saraksts nav atrasts' }, cookies);
				return fail(400, { message: 'Target tab not found' });
			}

			// If trying to drop on itself, do nothing
			if (draggedTabRecord.id === targetTab.id) {
				console.log('[reorderTabs] Dragged tab is same as target, no action needed');
				return { success: true, message: 'No changes needed' };
			}

			// Simply swap the order values between the two tabs
			const draggedOrder = draggedTabRecord.order;
			const targetOrder = targetTab.order;

			// Update both tabs with swapped orders
			await db.update(tab).set({ order: targetOrder }).where(eq(tab.id, draggedTabRecord.id));
			await db.update(tab).set({ order: draggedOrder }).where(eq(tab.id, targetTab.id));

			setFlash({ type: 'success', message: 'Saraksti veiksmīgi pārkārtoti' }, cookies);
			return { success: true, message: 'Tabs reordered successfully' };
		} catch (error) {
			setFlash(
				{ type: 'error', message: 'Radās neparedzēta kļūda sarakstu pārkārtošanas laikā' },
				cookies
			);
			return fail(500, { message: 'Internal server error' });
		}
	}
} satisfies Actions;
