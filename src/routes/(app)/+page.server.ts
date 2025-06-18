import { db } from '$lib/server/db';
import { task, user, client, notification } from '$lib/server/db/schema';
import { sql, count, sum, desc, eq, and, or, lte, gte } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Get the current month's start and end dates
	const now = new Date();
	const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

	// Get today and tomorrow for urgent tasks
	const today = new Date();
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const todayStr = today.toISOString().split('T')[0];
	const tomorrowStr = tomorrow.toISOString().split('T')[0];

	// Get top managers (users with most managed tasks this month)
	const topManagers = await db
		.select({
			id: user.id,
			name: user.name,
			taskCount: count(task.id)
		})
		.from(user)
		.leftJoin(
			task,
			sql`${task.managerId} = ${user.id} AND ${task.created_at} >= ${Math.floor(currentMonthStart.getTime() / 1000)} AND ${task.created_at} <= ${Math.floor(currentMonthEnd.getTime() / 1000)}`
		)
		.groupBy(user.id, user.name)
		.orderBy(desc(count(task.id)))
		.limit(5);

	// Get top responsible persons (users with most responsible tasks this month)
	const topResponsiblePersons = await db
		.select({
			id: user.id,
			name: user.name,
			taskCount: count(task.id)
		})
		.from(user)
		.leftJoin(
			task,
			sql`${task.responsiblePersonId} = ${user.id} AND ${task.created_at} >= ${Math.floor(currentMonthStart.getTime() / 1000)} AND ${task.created_at} <= ${Math.floor(currentMonthEnd.getTime() / 1000)}`
		)
		.groupBy(user.id, user.name)
		.orderBy(desc(count(task.id)))
		.limit(5);

	// Get urgent tasks for current user (due today, tomorrow, or overdue)
	const urgentTasks = await db
		.select({
			id: task.id,
			title: task.title,
			endDate: task.endDate,
			clientName: client.name
		})
		.from(task)
		.leftJoin(client, eq(task.clientId, client.id))
		.where(
			and(
				eq(task.responsiblePersonId, locals.user!.id),
				or(
					eq(task.endDate, todayStr),
					eq(task.endDate, tomorrowStr),
					sql`${task.endDate} < ${todayStr}`
				)
			)
		)
		.orderBy(task.endDate)
		.limit(10);

	const userNotifications = await db
		.select({
			id: notification.id,
			text: notification.message,
			userId: notification.userId
		})
		.from(notification)
		.limit(5);

	// Get best clients by total ordered
	const bestClients = await db
		.select({
			id: client.id,
			name: client.name,
			totalOrdered: client.totalOrdered
		})
		.from(client)
		.where(sql`${client.totalOrdered} > 0`)
		.orderBy(desc(client.totalOrdered))
		.limit(5); // Get all monthly profit data (not limited to 6 months for the query)
	const monthlyProfits = await db
		.select({
			month: sql<string>`strftime('%Y-%m', datetime(${task.created_at}, 'unixepoch'))`,
			profit: sum(task.price)
		})
		.from(task)
		.where(sql`${task.price} IS NOT NULL`)
		.groupBy(sql`strftime('%Y-%m', datetime(${task.created_at}, 'unixepoch'))`)
		.orderBy(sql`strftime('%Y-%m', datetime(${task.created_at}, 'unixepoch'))`);
	// Create array of last 12 months with zero values as default
	const chartData = [];
	for (let i = 11; i >= 0; i--) {
		const date = new Date();
		date.setMonth(date.getMonth() - i);
		const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format

		// Find if we have data for this month
		const monthData = monthlyProfits.find((item) => item.month === monthStr);

		chartData.push({
			month: monthStr,
			profit: Number(monthData?.profit) || 0
		});
	}

	// Calculate total profit for current month
	const currentMonthProfit = await db
		.select({
			total: sum(task.price)
		})
		.from(task)
		.where(
			sql`${task.created_at} >= ${Math.floor(currentMonthStart.getTime() / 1000)} AND ${task.created_at} <= ${Math.floor(currentMonthEnd.getTime() / 1000)} AND ${task.price} IS NOT NULL`
		);
	return {
		topManagers: topManagers.filter((manager) => manager.taskCount > 0),
		topResponsiblePersons: topResponsiblePersons.filter((person) => person.taskCount > 0),
		bestClients: bestClients.filter((client) => client.totalOrdered),
		urgentTasks,
		userNotifications,
		chartData,
		currentMonthProfit: currentMonthProfit[0]?.total || 0
	};
};
