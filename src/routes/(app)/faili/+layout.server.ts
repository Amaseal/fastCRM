import { db } from '$lib/server/db';
import { fileSchema } from './shema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { file, task } from '$lib/server/db/schema';
import { and, desc, asc, sql, count, like, or } from 'drizzle-orm';

export const load = async ({ url }) => {
	// Parse query parameters
	const page = parseInt(url.searchParams.get('page') || '0');
	const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
	const search = url.searchParams.get('search') || '';
	const sortColumn = url.searchParams.get('sortColumn') || 'id';
	const sortDirection = url.searchParams.get('sortDirection') || 'desc';

	// Calculate offset for pagination
	const offset = page * pageSize;

	// Build the filter conditions
	let filterConditions = [];

	if (search) {
		const searchTerm = `%${search}%`;
		filterConditions.push(
			or(
				like(file.filename, searchTerm),
				like(file.downloadUrl, searchTerm)
			)
		);
	}

	// Get total count for pagination
	const [{ value: totalCount }] = await db
		.select({ value: count() })
		.from(file)
		.where(filterConditions.length > 0 ? and(...filterConditions) : sql`1=1`);
	// Create a safe mapping of sortable columns
	const sortableColumns = {
		filename: file.filename,
		size: file.size,
		created_at: file.created_at,
		taskId: file.taskId
	};

	// Choose the column to sort by
	const columnToSort =
		sortColumn in sortableColumns
			? sortableColumns[sortColumn as keyof typeof sortableColumns]
			: file.id; // Default to id

	// Get paginated data with proper sorting and task relation
	const files = await db.query.file.findMany({
		where: filterConditions.length > 0 ? and(...filterConditions) : undefined,
		orderBy: sortDirection === 'asc' ? asc(columnToSort) : desc(columnToSort),
		limit: pageSize,
		offset: offset,
		with: {
			task: {
				columns: {
					id: true,
					title: true
				}
			}
		}
	});

	const form = await superValidate(zod(fileSchema));

	return {
		form,
		files,
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