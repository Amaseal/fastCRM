import { db } from '$lib/server/db';
import { task, tab, client, material, product, user } from '$lib/server/db/schema';
import { asc, eq, and, or, sql, ne } from 'drizzle-orm';
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
		where: ne(tab.title, 'done'),
		orderBy: [asc(tab.order)]
	})) as TabWithRelations[];
	const tabsWithTasks = groupTasksByTab(tasks, tabs);

	// Get all users for manager filtering
	const users = await db.query.user.findMany({
		orderBy: [asc(user.name)]
	});

	// Group tabs by their tags

	const taskForm = await superValidate(zod(taskSchema));

	return {
		tabs: tabsWithTasks,
		taskForm,
		users
	};
};
