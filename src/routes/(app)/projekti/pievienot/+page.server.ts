import { db } from '$lib/server/db';
import { taskSchema } from '../schema';
import { fail, superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import {
	client,
	material,
	product,
	task,
	taskMaterial,
	taskProduct,
	file
} from '$lib/server/db/schema';
import { setFlash } from 'sveltekit-flash-message/server';
import { redirect } from '@sveltejs/kit';
import { asc, inArray, eq } from 'drizzle-orm';

export const load = async ({ url }) => {
	const tabId = url.searchParams.get('tabId');

	// If tabId is provided, set it as default in the form
	const form = await superValidate(zod(taskSchema));
	if (tabId) {
		form.data.tabId = Number(tabId);
	}

	const materials = await db.query.material.findMany({
		orderBy: [asc(material.title)]
	});

	const clients = await db.query.client.findMany({
		orderBy: [asc(client.name)]
	});

	const users = await db.query.user.findMany();
	const products = await db.query.product.findMany({
		orderBy: [asc(product.title)]
	});

	return {
		form,
		materials,
		clients,
		users,
		products,
		tabId: tabId ? Number(tabId) : 1
	};
};

export const actions = {
	default: async ({ request, cookies, locals, url }) => {
		// Validate the form data with superforms
		const form = await superValidate(request, zod(taskSchema));
console.log(form.valid)
		// If form validation fails, return the form with errors
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const currentUser = locals.user;

			if (!currentUser) {
				return fail(401, { form, message: 'User not authorized' });
			}

			const {
				title,
				description,
				tabId,
				clientId,
				responsiblePersonId,
				endDate,
				materialIds,
				preview,
				taskProducts,
				files,
				price,
				count,
				seamstress
			} = form.data;

			if (!tabId) {
				return fail(400, { form, message: 'Tab ID is required' });
			}

			// Handle new client creation if needed
			let actualClientId = clientId;
			if (!clientId && form.data.newClientName) {
				const {
					newClientName,
					newClientEmail,
					newClientPhone,
					newClientDescription,
					newClientType
				} = form.data;

				if (newClientName) {
					// Create new client first
					const [newClient] = await db
						.insert(client)
						.values({
							name: newClientName,
							email: newClientEmail || null,
							phone: newClientPhone || null,
							description: newClientDescription || null,
							type: newClientType || 'BTB'
						})
						.returning({ id: client.id });

					actualClientId = newClient.id;
				}
			}

			// Create the task with all available fields
			const [newTask] = await db
				.insert(task)
				.values({
					title,
					description: description || null,
					price: price || 0,
					count: count || 1,
					tabId: Number(tabId),
					clientId: actualClientId ? Number(actualClientId) : null,
					responsiblePersonId: responsiblePersonId || null,
					managerId: currentUser.id,
					endDate: endDate || null,
					preview: preview || null,
					seamstress: seamstress || null
				})
				.returning({ id: task.id });

			// Associate materials with the task through the junction table
			if (materialIds && materialIds.length > 0) {
				// Create a task-material association for each material ID
				for (const materialId of materialIds) {
					await db.insert(taskMaterial).values({
						taskId: newTask.id,
						materialId: Number(materialId)
					});
				}
			}

			// Associate products with the task through the junction table
			if (taskProducts && taskProducts.length > 0) {
				// Create a task-product association for each product entry
				for (const prod of taskProducts) {
					if (prod.productId && prod.productId !== 0 && !isNaN(Number(prod.productId))) {
						await db.insert(taskProduct).values({
							taskId: newTask.id,
							productId: Number(prod.productId),
							count: prod.count || 1
						});
					} else {
						console.warn(`Skipping invalid product entry:`, prod);
					}
				}
			}			// Associate files with the new task by updating the taskId in the files table
			if (files && files.length > 0) {
				await db.update(file).set({ taskId: newTask.id }).where(inArray(file.id, files));
			}

			// Update client's totalOrdered if client is selected and price is set
			if (actualClientId && price && price > 0) {
				// Get current client data
				const currentClient = await db.query.client.findFirst({
					where: eq(client.id, actualClientId)
				});
				
				if (currentClient) {
					const currentTotal = currentClient.totalOrdered || 0;
					const newTotal = currentTotal + price;
					
					await db
						.update(client)
						.set({ totalOrdered: newTotal })
						.where(eq(client.id, actualClientId));
				}
			}		// Return success message
		setFlash({ type: 'success', message: 'Projekts veiksmīgi izveidots!' }, cookies);
	} catch (error) {
		console.error('Error saving task:', error);
		return fail(500, { form, message: 'Internal server error' });
	}

	// Preserve search parameters in redirect
	const searchParams = new URLSearchParams();
	if (url.searchParams.get('search')) {
		searchParams.set('search', url.searchParams.get('search')!);
	}
	if (url.searchParams.get('manager')) {
		searchParams.set('manager', url.searchParams.get('manager')!);
	}
	
	const redirectUrl = `/projekti${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
	redirect(303, redirectUrl);
	}
};
