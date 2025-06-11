import { db } from '$lib/server/db';
import { task, tab, client, material, product } from '$lib/server/db/schema';
import { asc, eq, and, or, sql } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { taskSchema } from './schema';

import { zod } from 'sveltekit-superforms/adapters';
import type { TabWithRelations, TaskWithRelations } from '$lib/types';
import { groupTasksByTab } from '$lib/server/utils';

export const load = async ({ url, locals }) => {
	const search = url.searchParams.get('search') || '';
	const managerFilter = url.searchParams.get('manager') || '';
	const responsibleFilter = url.searchParams.get('responsible') || '';
	const clientFilter = url.searchParams.get('client') || '';
	// Build the filter conditions for tasks
	let taskConditions = [];
	if (search) {
		const searchTerm = `%${search}%`;
		// Search in task title and related entities
		taskConditions.push(
			or(
				sql`(${task.title} LIKE ${searchTerm})`,
				// Add subqueries to search in related entities				// Search in client name
				sql`EXISTS (
					SELECT 1 FROM "clients" 
					WHERE "clients"."id" = ${task.clientId} AND ${task.clientId} IS NOT NULL AND "clients"."name" LIKE ${searchTerm}
				)`,
				// Search in manager name
				sql`EXISTS (
					SELECT 1 FROM "users" AS manager
					WHERE manager."id" = ${task.managerId} AND ${task.managerId} IS NOT NULL AND manager."name" LIKE ${searchTerm}
				)`,
				// Search in responsible person name
				sql`EXISTS (
					SELECT 1 FROM "users" AS responsible
					WHERE responsible."id" = ${task.responsiblePersonId} AND ${task.responsiblePersonId} IS NOT NULL AND responsible."name" LIKE ${searchTerm}
				)`
			)
		);
	}

	if (managerFilter) {
		taskConditions.push(eq(task.managerId, managerFilter));
	}

	if (responsibleFilter) {
		taskConditions.push(eq(task.responsiblePersonId, responsibleFilter));
	}
	if (clientFilter) {
		taskConditions.push(eq(task.clientId, Number(clientFilter)));
	} // Fetch all tabs except the Done tab (tag 'done')

	let tasksQuery = db.query.task.findMany({
		where: taskConditions.length > 0 ? and(...taskConditions) : undefined,
		with: {
			client: true,
			manager: true,
			responsiblePerson: true,
			materials: {
				with: {
					material: true
				}
			},
			taskProducts: {
				with: {
					product: true
				}
			},
			files: true
		}
	});
	const tasks = (await tasksQuery) as TaskWithRelations[];

	const tabs = (await db.query.tab.findMany({
		orderBy: [asc(tab.order)]
	})) as TabWithRelations[];

	const tabsWithTasks = groupTasksByTab(tasks, tabs);

	// Group tabs by their tags

	const taskForm = await superValidate(zod(taskSchema));

	return {
		tabs: tabsWithTasks,
		taskForm
	};
};

// export const actions = {
// 	editCategory: async ({ request }) => {
// 		try {
// 			// Parse form data
// 			const formData = await request.formData();
// 			const draggedItemRaw = formData.get('draggedItem');
// 			const sourceTabId = formData.get('sourceContainer') as string;
// 			const targetTabId = formData.get('targetContainer') as string;

// 			// Validate input
// 			if (!draggedItemRaw || !sourceTabId || !targetTabId) {
// 				return fail(400, { message: 'Missing required values' });
// 			}

// 			const draggedItem = JSON.parse(draggedItemRaw as string);
// 			const taskId = draggedItem?.id;

// 			if (!taskId) {
// 				return fail(400, { message: 'Invalid dragged item' });
// 			}

// 			// If source and target are the same, do nothing
// 			if (sourceTabId === targetTabId) {
// 				return { success: true, message: 'No changes needed' };
// 			}

// 			// Update task's tab field to the new tab
// 			await db
// 				.update(task)
// 				.set({ tabId: parseInt(targetTabId, 10) })
// 				.where(eq(task.id, Number(taskId)));

// 			return { success: true, message: 'Task moved successfully' };
// 		} catch (error) {
// 			console.error('Error updating task category:', error);
// 			return fail(500, { message: 'Internal server error' });
// 		}
// 	},
// 	deleteTask: async ({ request }) => {
// 		try {
// 			// Parse form data
// 			const formData = await request.formData();
// 			const id = formData.get('id');

// 			if (!id) {
// 				return fail(400, { message: 'Missing task ID' });
// 			}

// 			// Delete the task
// 			await db.delete(task).where(eq(task.id, Number(id)));

// 			return { success: true };
// 		} catch (error) {
// 			console.error('Error deleting task:', error);
// 			return fail(500, { message: 'Internal server error' });
// 		}
// 	},
// 	moveToDone: async ({ request }) => {
// 		try {
// 			const formData = await request.formData();
// 			const id = formData.get('id') as string;

// 			if (!id) {
// 				return fail(400, { message: 'Missing task ID' });
// 			}

// 			// Find the "Pabeigts" tab
// 			const doneTab = await db.query.tab.findFirst({
// 				where: eq(tab.title, 'Pabeigts')
// 			});

// 			if (!doneTab) {
// 				return fail(404, { message: 'Done tab not found' });
// 			}

// 			// Update task's tab to the "Pabeigts" tab
// 			await db
// 				.update(task)
// 				.set({ tabId: doneTab.id })
// 				.where(eq(task.id, Number(id)));

// 			return { success: true };
// 		} catch (error) {
// 			console.error('Error moving task to done:', error);
// 			return fail(500, { message: 'Internal server error' });
// 		}
// 	},

// 	saveTask: async ({ locals, request }) => {
// 		// Validate the form data with superforms
// 		const form = await superValidate(request, zod(taskSchema));

// 		console.log('Form data:', form.data);

// 		// If form validation fails, return the form with errors
// 		if (!form.valid) {
// 			return fail(400, { form });
// 		}

// 		try {
// 			const currentUser = locals.user;

// 			if (!currentUser) {
// 				return fail(401, { form, message: 'User not authorized' });
// 			}			// Extract validated data
// 			const {
// 				title,
// 				description,
// 				tabId,
// 				clientId,
// 				responsiblePersonId,
// 				endDate,
// 				materialIds,
// 				preview,
// 				taskProducts,
// 				files // Add fileIds field
// 			} = form.data;

// 			if (!tabId) {
// 				return fail(400, { form, message: 'Tab ID is required' });
// 			}			// Handle new client creation if needed
// 			let actualClientId = clientId;
// 			if (!clientId && form.data.newClientName) {
// 				const {
// 					newClientName,
// 					newClientEmail,
// 					newClientPhone,
// 					newClientDescription,
// 					newClientType
// 				} = form.data;

// 				if (newClientName) {
// 					// Create new client first
// 					const [newClient] = await db
// 						.insert(client)
// 						.values({
// 							name: newClientName,
// 							email: newClientEmail || null,
// 							phone: newClientPhone || null,
// 							description: newClientDescription || null,
// 							type: newClientType || 'BTB'
// 						})
// 						.returning({ id: client.id });

// 					actualClientId = newClient.id;
// 				}
// 			}			// Process the description - always stringify the JSON object

// 			// Create the task with all available fields
// 			const [newTask] = await db
// 				.insert(task)
// 				.values({
// 					title,
// 					description: description,
// 					price: form.data.price,
// 					count: form.data.count,
// 					tabId: Number(tabId),
// 					clientId: actualClientId ? Number(actualClientId) : null,
// 					responsiblePersonId: responsiblePersonId || null,
// 					managerId: currentUser.id,
// 					endDate: endDate || null,
// 					preview: preview || null
// 					// Remove materialId and taskProductIds as they need to be handled separately
// 				})
// 				.returning({ id: task.id });
// 			// Associate materials with the task through the junction table
// 			if (materialIds && materialIds.length > 0) {
// 				// Create a task-material association for each material ID
// 				for (const materialId of materialIds) {
// 					await db.insert(taskMaterial).values({
// 						taskId: newTask.id,
// 						materialId: Number(materialId),
// 					});
// 				}
// 			}

// 			// Associate products with the task through the junction table
// 			if (taskProducts && taskProducts.length > 0) {
// 				// Create a task-product association for each product entry
// 				for (const prod of taskProducts) {
// 					if (prod.productId && !isNaN(Number(prod.productId))) {
// 						await db.insert(taskProduct).values({
// 							taskId: newTask.id,
// 							productId: Number(prod.productId),
// 							count: prod.count || 1
// 						});
// 					} else {
// 						console.warn(`Skipping invalid product entry:`, prod);
// 					}
// 				}
// 			}

// 			// Associate files with the new task by updating the taskId in the files table
// 			if (files && files.length > 0) {
// 				await db
// 					.update(file)
// 					.set({ taskId: newTask.id })
// 					.where(inArray(file.id, files));
// 			}

// 			// Return success message
// 			return message(form, 'Task created successfully');
// 		} catch (error) {
// 			console.error('Error saving task:', error);
// 			return fail(500, { form, message: 'Internal server error' });
// 		}
// 	},
// 	createTab: async ({ request }) => {
// 		// Validate the form data with superforms
// 		const form = await superValidate(request, zod(tabSchema));

// 		// If form validation fails, return the form with errors
// 		if (!form.valid) {
// 			return fail(400, { form });
// 		}

// 		try {
// 			// Extract validated data
// 			const { title, color, tag: tagValue } = form.data;

// 			// Find the tag if a tag ID was selected
// 			let tagId = null;
// 			if (tagValue) {
// 				tagId = parseInt(tagValue, 10);
// 			}

// 			// Create new tab
// 			const [newTab] = await db
// 				.insert(tab)
// 				.values({
// 					title,
// 					color: color || '#3b82f6',
// 					tagId
// 				})
// 				.returning();

// 			// Return the form with success status
// 			return message(form, 'Tab created successfully');
// 		} catch (error) {
// 			console.error('Error creating new tab:', error);
// 			// Return the form with the server error
// 			return fail(500, { form, message: 'Internal server error' });
// 		}
// 	},
// 	updateTab: async ({ request }) => {
// 		// Validate the form data with superforms
// 		const form = await superValidate(request, zod(tabSchema));

// 		// If form validation fails, return the form with errors
// 		if (!form.valid) {
// 			return fail(400, { form });
// 		}

// 		try {
// 			// Extract validated data
// 			const { id, title, color, tag: tagValue } = form.data;

// 			if (!id) {
// 				return fail(400, { form, message: 'Missing tab ID' });
// 			}

// 			// Convert tag to tagId
// 			let tagId = null;
// 			if (tagValue) {
// 				tagId = parseInt(tagValue, 10);
// 			}

// 			// Update the tab
// 			await db
// 				.update(tab)
// 				.set({
// 					title,
// 					color: color || '#3b82f6',
// 					tagId
// 				})
// 				.where(eq(tab.id, id));

// 			// Return the form with success status
// 			return message(form, 'Tab updated successfully');
// 		} catch (error) {
// 			console.error('Error updating tab:', error);
// 			// Return the form with the server error
// 			return fail(500, { form, message: 'Internal server error' });
// 		}
// 	},
// 	deleteTab: async ({ request }) => {
// 		// Validate the form data with superforms
// 		const form = await superValidate(request, zod(deleteSchema));

// 		// If form validation fails, return the form with errors
// 		if (!form.valid) {
// 			return fail(400, { form });
// 		}

// 		try {
// 			const { id } = form.data;

// 			if (!id) {
// 				form.errors._errors = ['Missing tab ID'];
// 				return fail(400, { form });
// 			}

// 			// Check if there are tasks using this tab
// 			const tasksWithTab = await db.query.task.findMany({
// 				where: eq(task.tabId, id)
// 			});

// 			if (tasksWithTab.length > 0) {
// 				// Move tasks to a default tab or delete tasks
// 				// For now, let's return an error to prevent unintended task deletion
// 				return fail(400, {
// 					form,
// 					message:
// 						'Cannot delete tab that contains tasks. Please move the tasks to another tab first.'
// 				});
// 			}

// 			// Delete the tab
// 			await db.delete(tab).where(eq(tab.id, id));

// 			// Return the form with success status
// 			return message(form, 'Tab deleted successfully');
// 		} catch (error) {
// 			console.error('Error deleting tab:', error);
// 			return fail(500, { form, message: 'Internal server error' });
// 		}
// 	}, // Tab ordering functionality removed as per requirements
// 	createTag: async ({ request }) => {
// 		// Validate the form data with superforms
// 		const form = await superValidate(request, zod(tagSchema));

// 		// If form validation fails, return the form with errors
// 		if (!form.valid) {
// 			return fail(400, { form });
// 		}

// 		try {
// 			// Extract validated data
// 			const { title, tag: tagValue } = form.data;

// 			// Check if tag already exists
// 			const existingTag = await db.query.tag.findFirst({
// 				where: eq(tag.tag, tagValue)
// 			});

// 			if (existingTag) {
// 				form.errors = { tag: ['This tag identifier already exists'] };
// 				return fail(400, { form, message: 'Tag identifier already exists' });
// 			}

// 			// Get the highest current order value
// 			const highestOrder = await db.select({ maxOrder: sql`MAX(${tag.order})` }).from(tag);
// 			const nextOrder =
// 				(highestOrder[0]?.maxOrder === null || highestOrder[0]?.maxOrder === undefined
// 					? 0
// 					: Number(highestOrder[0]?.maxOrder)) + 1;

// 			// Create new tag with the calculated next order
// 			await db.insert(tag).values({
// 				title,
// 				tag: tagValue,
// 				order: nextOrder
// 			});

// 			// Return the form with success status
// 			return message(form, 'Tag created successfully');
// 		} catch (error) {
// 			console.error('Error creating new tag:', error);
// 			// Return the form with the server error
// 			return fail(500, { form, message: 'Internal server error' });
// 		}
// 	},
// 	updateTag: async ({ request }) => {
// 		// Validate the form data with superforms
// 		const form = await superValidate(request, zod(tagSchema));

// 		// If form validation fails, return the form with errors
// 		if (!form.valid) {
// 			return fail(400, { form });
// 		}

// 		try {
// 			// Extract validated data
// 			const { id, title, tag: tagValue, order } = form.data;

// 			if (!id) {
// 				return fail(400, { form, message: 'Missing tag ID' });
// 			}

// 			// Check if another tag with the same tag identifier exists
// 			const existingTag = await db.query.tag.findFirst({
// 				where: and(eq(tag.tag, tagValue), ne(tag.id, id))
// 			});

// 			if (existingTag) {
// 				form.errors = { tag: ['This tag identifier already exists'] };
// 				return fail(400, { form, message: 'Tag identifier already exists' });
// 			}

// 			// Update the tag
// 			await db
// 				.update(tag)
// 				.set({
// 					title,
// 					tag: tagValue,
// 					order
// 				})
// 				.where(eq(tag.id, id));

// 			// Return the form with success status
// 			return message(form, 'Tag updated successfully');
// 		} catch (error) {
// 			console.error('Error updating tag:', error);
// 			// Return the form with the server error
// 			return fail(500, { form, message: 'Internal server error' });
// 		}
// 	},
// 	deleteTag: async ({ request }) => {
// 		// Validate the form data with superforms
// 		const form = await superValidate(request, zod(deleteSchema));

// 		// If form validation fails, return the form with errors
// 		if (!form.valid) {
// 			return fail(400, { form });
// 		}

// 		try {
// 			const { id } = form.data;

// 			if (!id) {
// 				form.errors._errors = ['Missing tag ID'];
// 				return fail(400, { form });
// 			}

// 			// Check if there are tabs using this tag
// 			const tabsWithTag = await db.query.tab.findMany({
// 				where: eq(tab.tagId, id)
// 			});

// 			if (tabsWithTag.length > 0) {
// 				return fail(400, { form, message: 'Cannot delete tag that is used by tabs' });
// 			}

// 			// Delete the tag
// 			await db.delete(tag).where(eq(tag.id, id));

// 			// Return the form with success status
// 			return message(form, 'Tag deleted successfully');
// 		} catch (error) {
// 			console.error('Error deleting tag:', error);
// 			return fail(500, { form, message: 'Internal server error' });
// 		}
// 	},
// 	updateTagOrders: async ({ request }) => {
// 		try {
// 			// Parse FormData
// 			const formData = await request.formData();

// 			// Process the FormData to extract tag information
// 			const tagMap = new Map();

// 			// Collect all form field keys
// 			for (const key of formData.keys()) {
// 				// Check if key matches the pattern tags[index][property]
// 				if (key.startsWith('tags[')) {
// 					const matches = key.match(/tags\[(\d+)\]\[(\w+)\]/);
// 					if (matches) {
// 						const index = matches[1];
// 						const property = matches[2];
// 						const value = formData.get(key);

// 						// Initialize tag object if it doesn't exist
// 						if (!tagMap.has(index)) {
// 							tagMap.set(index, {});
// 						}

// 						// Add property to the tag object
// 						const tagObj = tagMap.get(index);
// 						tagObj[property] = property === 'id' ? Number(value) : Number(value);
// 					}
// 				}
// 			}

// 			// Convert the Map to an array of tags
// 			const updatedTags = Array.from(tagMap.values());

// 			if (!updatedTags.length) {
// 				return fail(400, { message: 'No tag data provided' });
// 			}

// 			// Update each tag's order in the database
// 			for (const updatedTag of updatedTags) {
// 				if (updatedTag.id !== undefined && updatedTag.order !== undefined) {
// 					await db.update(tag).set({ order: updatedTag.order }).where(eq(tag.id, updatedTag.id));
// 				}
// 			}
// 			return { success: true, message: 'Tag order updated successfully' };
// 		} catch (error) {
// 			console.error('Error updating tag orders:', error);
// 			return fail(500, { message: 'Internal server error' });
// 		}
// 	},
// 	editTask: async ({ locals, request }) => {
// 		// Validate the form data with superforms
// 		const form = await superValidate(request, zod(taskSchema));

// 		console.log('Editing task with form data:', form.data);

// 		// If form validation fails, return the form with errors
// 		if (!form.valid) {
// 			return fail(400, { form });
// 		}

// 		try {
// 			const currentUser = locals.user;

// 			if (!currentUser) {
// 				return fail(401, { form, message: 'User not authorized' });
// 			}

// 			// Extract validated data
// 			const {
// 				id,
// 				title,
// 				description,
// 				tabId,
// 				clientId,
// 				responsiblePersonId,
// 				endDate,
// 				count,
// 				price,
// 				materialIds,
// 				preview,
// 				taskProducts,
// 				files
// 			} = form.data;

// 			if (!id) {
// 				return fail(400, { form, message: 'Task ID is required for updates' });
// 			}

// 			// Update the task with all available fields
// 			await db
// 				.update(task)
// 				.set({
// 					title,
// 					description,
// 					price,
// 					count,
// 					tabId: Number(tabId),
// 					clientId: clientId ? Number(clientId) : null,
// 					responsiblePersonId: responsiblePersonId || null,
// 					endDate: endDate || null,
// 					preview: preview || null
// 				})
// 				.where(eq(task.id, Number(id)));

// 			// First, remove all existing material associations for this task
// 			await db.delete(taskMaterial).where(eq(taskMaterial.taskId, Number(id)));

// 			// Then add the new material associations
// 			if (materialIds && materialIds.length > 0) {
// 				for (const materialId of materialIds) {
// 					await db.insert(taskMaterial).values({
// 						taskId: Number(id),
// 						materialId: Number(materialId),
// 					});
// 				}
// 			}

// 			// First, remove all existing product associations for this task
// 			await db.delete(taskProduct).where(eq(taskProduct.taskId, Number(id)));
// 			// Then add the new product associations
// 			if (taskProducts && taskProducts.length > 0) {
// 				for (const prod of taskProducts) {
// 					if (prod.productId && !isNaN(Number(prod.productId))) {
// 						await db.insert(taskProduct).values({
// 							taskId: Number(id),
// 							productId: Number(prod.productId),
// 							count: prod.count || 1
// 						});
// 					} else {
// 						console.warn(`Skipping invalid product entry:`, prod);
// 					}
// 				}
// 			}

// 			// Handle files if needed (this depends on your file handling logic)
// 			if (files && files.length > 0) {
// 				// Update files to be associated with this task
// 				await db
// 					.update(file)
// 					.set({ taskId: Number(id) })
// 					.where(inArray(file.id, files));
// 			}

// 			return message(form, 'Task updated successfully');
// 		} catch (error) {
// 			console.error('Error updating task:', error);
// 			return fail(500, { form, message: 'Internal server error' });
// 		}
// 	}
// } satisfies Actions;
