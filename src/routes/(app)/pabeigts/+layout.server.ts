import { db } from '$lib/server/db';
import { task, tab, client, user, material, product, file, taskMaterial, taskProduct } from '$lib/server/db/schema';
import { and, desc, asc, sql, count, like, or, eq } from 'drizzle-orm';

export const load = async ({ url }) => {
	// Parse query parameters for pagination and filtering
	const page = parseInt(url.searchParams.get('page') || '0');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
	const search = url.searchParams.get('search') || '';
	const sortColumn = url.searchParams.get('sortColumn') || 'id';
	const sortDirection = url.searchParams.get('sortDirection') || 'desc';

	// Calculate offset for pagination
	const offset = page * pageSize;

	// Build the filter conditions
	let filterConditions = [];

	// First, find the "done" tab (Pabeigts or similar)
            const doneTab = await db.query.tab.findFirst({
                where: eq(tab.title, 'done')
            });

	if (doneTab) {
		// Filter tasks by the done tab
		filterConditions.push(eq(task.tabId, doneTab.id));
	} else {
		// If no done tab found, return empty results
		filterConditions.push(sql`1=0`);
	}

	// Add search filter if provided
	if (search) {
		const searchTerm = `%${search}%`;
		filterConditions.push(
			or(
				sql`(${task.title} LIKE ${searchTerm})`,
				// Search in client name
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

	// Get total count for pagination
	const [{ value: totalCount }] = await db
		.select({ value: count() })
		.from(task)
		.where(filterConditions.length > 0 ? and(...filterConditions) : undefined);

	// Create a safe mapping of sortable columns
	const sortableColumns = {
		title: task.title,
		price: task.price,
		created_at: task.created_at,
		updated_at: task.updated_at,
		endDate: task.endDate,
		count: task.count
	};

	// Choose the column to sort by
	const columnToSort =
		sortColumn in sortableColumns
			? sortableColumns[sortColumn as keyof typeof sortableColumns]
			: task.id; // Default to id

	// Get paginated data with proper sorting and relations
	const tasks = await db.query.task.findMany({
		where: filterConditions.length > 0 ? and(...filterConditions) : undefined,
		orderBy: sortDirection === 'asc' ? asc(columnToSort) : desc(columnToSort),
		limit: pageSize,
		offset: offset,
		with: {
			client: true,
			manager: true,
			responsiblePerson: true,
			tab: true,
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

	console.log(tasks)

	return {
		tasks,
		pagination: {
			page,
			pageSize,
			totalCount,
			totalPages: Math.ceil(totalCount / pageSize),
			search,
			sortColumn,
			sortDirection
		}
	};
};