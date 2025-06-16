import { db } from '$lib/server/db';
import { taskSchema } from '../../schema';
import { fail, superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import {
	client,
	material,
	product,
	task,
	taskMaterial,
	taskProduct,
	file,
	type Task
} from '$lib/server/db/schema';
import { setFlash } from 'sveltekit-flash-message/server';
import { redirect } from '@sveltejs/kit';
import { asc, eq, inArray } from 'drizzle-orm';

export const load = async ({ params }) => {
	let item = await db.query.task.findFirst({
		where: eq(task.id, Number(params.id)),
		with: {
			materials: true,
			taskProducts: {
				with: {
					product: true
				}
			},
			files: true
		}
	});

	if (!item) {
		throw new Error('Task not found');
	} // Transform the item for form compatibility
	const {
		materials: itemMaterials,
		taskProducts: itemTaskProducts,
		files: itemFiles,
		...baseItem
	} = item;

	const transformedItem = {
		...baseItem,
		// Convert null to undefined for form compatibility
		description: baseItem.description ?? undefined,
		tabId: baseItem.tabId ?? undefined,
		clientId: baseItem.clientId ?? undefined,
		managerId: baseItem.managerId ?? undefined,
		responsiblePersonId: baseItem.responsiblePersonId ?? undefined,
		count: baseItem.count ?? 1,
		endDate: baseItem.endDate ?? undefined,
		price: baseItem.price ?? 0,
		seamstress: baseItem.seamstress ?? undefined,
		preview: baseItem.preview ?? undefined,
		isPrinted: baseItem.isPrinted ?? false,

		// Transform relations to form-compatible format
		materialIds: itemMaterials?.map((m: any) => m.materialId) ?? [],
		taskProducts:
			itemTaskProducts?.map((tp: any) => ({
				id: tp.id,
				productId: tp.productId,
				count: tp.count
			})) ?? [],
		files: item.files
	};

	// Initialize the form with the transformed data
	const form = await superValidate(zod(taskSchema));

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
		item: transformedItem,
		users,
		products
	};
};

export const actions = {
	default: async ({ request, cookies, locals, params }) => {
		// Validate the form data with superforms
		const form = await superValidate(request, zod(taskSchema));
		console.log(form.valid);
		// If form validation fails, return the form with errors
		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			const currentUser = locals.user;

			if (!currentUser) {
				return fail(401, { form, message: 'User not authorized' });
			}

			const taskId = Number(params.id);
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

			// Update the task with all available fields
			await db
				.update(task)
				.set({
					title,
					description: description || null,
					price: price || 0,
					count: count || 1,
					tabId: Number(tabId),
					clientId: actualClientId ? Number(actualClientId) : null,
					responsiblePersonId: responsiblePersonId || null,
					endDate: endDate || null,
					preview: preview || null,
					seamstress: seamstress || null
				})
				.where(eq(task.id, taskId));

			// Update materials: delete existing and insert new ones
			if (materialIds !== undefined) {
				// Delete existing material associations
				await db.delete(taskMaterial).where(eq(taskMaterial.taskId, taskId));

				// Insert new material associations
				if (materialIds.length > 0) {
					for (const materialId of materialIds) {
						await db.insert(taskMaterial).values({
							taskId: taskId,
							materialId: Number(materialId)
						});
					}
				}
			}

			// Update task products: delete existing and insert new ones
			if (taskProducts !== undefined) {
				// Delete existing product associations
				await db.delete(taskProduct).where(eq(taskProduct.taskId, taskId));

				// Insert new product associations
				if (taskProducts.length > 0) {
					for (const prod of taskProducts) {
						if (prod.productId && prod.productId !== 0 && !isNaN(Number(prod.productId))) {
							await db.insert(taskProduct).values({
								taskId: taskId,
								productId: Number(prod.productId),
								count: prod.count || 1
							});
						} else {
							console.warn(`Skipping invalid product entry:`, prod);
						}
					}
				}
			}

			// Update files: clear existing associations and set new ones
			if (files !== undefined) {
				// Clear taskId from all files that were associated with this task
				await db.update(file).set({ taskId: null }).where(eq(file.taskId, taskId));

				// Associate new files with the task
				if (files.length > 0) {
					await db.update(file).set({ taskId: taskId }).where(inArray(file.id, files));
				}
			}

			// Return success message
			setFlash({ type: 'success', message: 'Projekts veiksmīgi atjaunināts!' }, cookies);
		} catch (error) {
			console.error('Error updating task:', error);
			return fail(500, { form, message: 'Internal server error' });
		}

		// Redirect after successful completion (outside try/catch)
		redirect(303, '/projekti');
	}
};
