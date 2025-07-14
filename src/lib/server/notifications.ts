import { db } from './db';
import { notification, task, tab, user } from './db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export interface NotificationContext {
	currentUserId: string;
	taskId: number;
	managerId?: string | null;
	responsiblePersonId?: string | null;
	actionType: 'created' | 'updated' | 'deleted' | 'moved';
	fromTabTitle?: string;
	toTabTitle?: string;
	taskTitle?: string;
}

/**
 * Creates notifications for task changes
 */
export async function createTaskNotifications({
	currentUserId,
	taskId,
	managerId,
	responsiblePersonId,
	actionType,
	fromTabTitle,
	toTabTitle,
	taskTitle
}: NotificationContext) {
	const notifications: Array<{ userId: string; message: string; taskId: number }> = [];

	// Determine who should receive notifications
	const recipients = new Set<string>();

	// Add manager to recipients if they exist and are not the current user
	if (managerId && managerId !== currentUserId) {
		recipients.add(managerId);
	}

	// Add responsible person to recipients if they exist and are not the current user
	if (responsiblePersonId && responsiblePersonId !== currentUserId) {
		recipients.add(responsiblePersonId);
	}

	// Don't create notifications if no recipients
	if (recipients.size === 0) {
		return;
	}

	// Get current user's name for the notification message
	const currentUser = await db.query.user.findFirst({
		where: eq(user.id, currentUserId),
		columns: { name: true }
	});

	const currentUserName = currentUser?.name || 'Lietotājs';
	const taskName = taskTitle || 'Projekts';

	// Generate notification message based on action type
	let message = '';
	switch (actionType) {
		case 'created':
			message = `${currentUserName} izveidoja jaunu projektu: "${taskName}"`;
			break;
		case 'updated':
			message = `${currentUserName} rediģēja projektu: "${taskName}"`;
			break;
		case 'deleted':
			message = `${currentUserName} izdzēsa projektu: "${taskName}"`;
			break;
		case 'moved':
			if (fromTabTitle && toTabTitle) {
				message = `${currentUserName} pārvietoja projektu "${taskName}" no "${fromTabTitle}" uz "${toTabTitle}"`;
			} else {
				message = `${currentUserName} pārvietoja projektu: "${taskName}"`;
			}
			break;
		default:
			message = `${currentUserName} veica izmaiņas projektā: "${taskName}"`;
	}

	// Create notification entries for each recipient
	for (const userId of recipients) {
		notifications.push({
			userId,
			message,
			taskId
		});
	}

	// Insert notifications into database
	if (notifications.length > 0) {
		await db.insert(notification).values(notifications);
	}
}

/**
 * Helper to get tab title by ID
 */
export async function getTabTitle(tabId: number): Promise<string | null> {
	const tabData = await db.query.tab.findFirst({
		where: eq(tab.id, tabId),
		columns: { title: true }
	});
	return tabData?.title || null;
}

/**
 * Get unread notifications for a user
 */
export async function getUserNotifications(userId: string) {
	return await db.query.notification.findMany({
		where: and(
			eq(notification.userId, userId),
			eq(notification.isRead, false)
		),
		orderBy: (notification, { desc }) => [desc(notification.created_at)],
		with: {
			task: {
				columns: {
					id: true,
					title: true
				}
			}
		}
	});
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(userId: string, notificationIds?: number[]) {
	const whereCondition = notificationIds 
		? and(eq(notification.userId, userId), inArray(notification.id, notificationIds))
		: eq(notification.userId, userId);
		
	await db.update(notification)
		.set({ isRead: true })
		.where(whereCondition);
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(notificationId: number, userId: string) {
	await db.update(notification)
		.set({ isRead: true })
		.where(and(
			eq(notification.id, notificationId),
			eq(notification.userId, userId)
		));
}
