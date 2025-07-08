import { db } from '$lib/server/db';
import { client } from '$lib/server/db/schema';
import { and, desc, asc, sql, count } from 'drizzle-orm';

export const load = async ({ url }) => {
	const page = parseInt(url.searchParams.get('page') || '0');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
	const search = url.searchParams.get('search') || '';
	const sortColumn = url.searchParams.get('sortColumn') || 'id';
	const sortDirection = url.searchParams.get('sortDirection') || 'asc';

	// Calculate offset for pagination
	const offset = page * pageSize;

	// Build the filter conditions
	let filterConditions = [];

	if (search) {
		const searchTerm = `%${search}%`;
		filterConditions.push(
			sql`(${client.name} LIKE ${searchTerm} OR ${client.type} LIKE ${searchTerm})`
		);
	}

	// Get total count for pagination
	const [{ value: totalCount }] = await db
		.select({ value: count() })
		.from(client)
		.where(filterConditions.length > 0 ? and(...filterConditions) : sql`1=1`);

	// Create a safe mapping of sortable columns
	const sortableColumns = {
		name: client.name,
		type: client.type,
		totalOrdered: client.totalOrdered
	};

	// Choose the column to sort by
	const columnToSort =
		sortColumn in sortableColumns
			? sortableColumns[sortColumn as keyof typeof sortableColumns]
			: client.id; // Default to id

	// Get paginated data with proper sorting
	const clients = await db.query.client.findMany({
		where: filterConditions.length > 0 ? and(...filterConditions) : undefined,
		orderBy: sortDirection === 'asc' ? asc(columnToSort) : desc(columnToSort),
		limit: pageSize,
		offset: offset
	});

	return {
		clients,
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
