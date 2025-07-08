import { db } from '$lib/server/db';
import { task, user, client, notification, taskProduct, product } from '$lib/server/db/schema';
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
	const tomorrowStr = tomorrow.toISOString().split('T')[0];	// Get top managers (users with most managed tasks all time)
	const topManagers = await db
		.select({
			id: user.id,
			name: user.name,
			taskCount: count(task.id)
		})
		.from(user)
		.leftJoin(task, eq(task.managerId, user.id))
		.groupBy(user.id, user.name)
		.orderBy(desc(count(task.id)))
		.limit(5);	// Get top responsible persons (users with most responsible tasks all time)
	const topResponsiblePersons = await db
		.select({
			id: user.id,
			name: user.name,
			taskCount: count(task.id)
		})
		.from(user)
		.leftJoin(task, eq(task.responsiblePersonId, user.id))
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
		.limit(5);	// Get all monthly profit data with product costs subtracted
	const monthlyProfits = await db
		.select({
			month: sql<string>`strftime('%Y-%m', datetime(${task.created_at}, 'unixepoch'))`,
			taskId: task.id,
			taskPrice: task.price,
			productCost: sql<number>`COALESCE(SUM(${taskProduct.count} * ${product.cost}), 0)`
		})
		.from(task)
		.leftJoin(taskProduct, eq(task.id, taskProduct.taskId))
		.leftJoin(product, eq(taskProduct.productId, product.id))
		.where(sql`${task.price} IS NOT NULL`)
		.groupBy(
			task.id, 
			task.price, 
			sql`strftime('%Y-%m', datetime(${task.created_at}, 'unixepoch'))`
		)
		.orderBy(sql`strftime('%Y-%m', datetime(${task.created_at}, 'unixepoch'))`);

	// Calculate profit by month (task price - product costs)
	const monthlyProfitSums = monthlyProfits.reduce((acc, item) => {
		const profit = (item.taskPrice || 0) - (item.productCost || 0);
		if (!acc[item.month]) {
			acc[item.month] = 0;
		}
		acc[item.month] += profit;
		return acc;
	}, {} as Record<string, number>);	// Create array of last 12 months with zero values as default
	const chartData = [];
	for (let i = 11; i >= 0; i--) {
		const date = new Date();
		date.setMonth(date.getMonth() - i);
		const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format

		// Find if we have data for this month
		const monthProfit = monthlyProfitSums[monthStr] || 0;

		chartData.push({
			month: monthStr,
			profit: monthProfit
		});
	}	// Calculate profit for current month (task prices - product costs)
	const currentMonthTasks = await db
		.select({
			taskId: task.id,
			taskPrice: task.price,
			productCost: sql<number>`COALESCE(SUM(${taskProduct.count} * ${product.cost}), 0)`
		})
		.from(task)
		.leftJoin(taskProduct, eq(task.id, taskProduct.taskId))
		.leftJoin(product, eq(taskProduct.productId, product.id))
		.where(
			and(
				gte(task.created_at, currentMonthStart),
				lte(task.created_at, currentMonthEnd),
				sql`${task.price} IS NOT NULL`
			)
		)
		.groupBy(task.id, task.price);

	// Calculate total profit for current month
	const currentMonthProfit = currentMonthTasks.reduce((total, taskData) => {
		const profit = (taskData.taskPrice || 0) - (taskData.productCost || 0);
		return total + profit;
	}, 0);	return {
		topManagers,
		topResponsiblePersons,
		bestClients: bestClients.filter((client) => client.totalOrdered),
		urgentTasks,
		userNotifications,
		chartData,
		currentMonthProfit: currentMonthProfit
	};
};
