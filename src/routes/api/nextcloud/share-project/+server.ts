import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { tab, task, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals }) => {
	const sessionUser = locals.user;
	if (!sessionUser) {
		return json({ error: 'Nav autorizēts' }, { status: 401 });
	}

	// Get full user data from database
	const fullUser = await db.query.user.findFirst({
		where: eq(user.id, sessionUser.id)
	});

	if (!fullUser) {
		return json({ error: 'Lietotājs nav atrasts' }, { status: 404 });
	}

	// Check if user has Nextcloud credentials configured
	if (!fullUser.nextcloud_username || !fullUser.nextcloud_password) {
		return json(
			{
				error: 'Nextcloud iestatījumi nav konfigurēti. Lūdzu, dodieties uz iestatījumiem.'
			},
			{ status: 400 }
		);
	}
	const NEXTCLOUD_URL = env.NEXTCLOUD_URL;
	if (!NEXTCLOUD_URL) {
		return json({ error: 'Nextcloud URL nav konfigurēts sistēmā' }, { status: 500 });
	}

	try {
		const { projectId, conversationToken, messageType = 'rich' } = await request.json();
		if (!projectId || !conversationToken) {
			return json({ error: 'Trūkst obligāto parametru' }, { status: 400 });
		}

		// Get the project (tab) with its tasks
		const project = await db.query.tab.findFirst({
			where: eq(tab.id, projectId),
			with: {
				tasks: {
					with: {
						client: true,
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
				}
			}
		});
		if (!project) {
			return json({ error: 'Projekts nav atrasts' }, { status: 404 });
		}

		const baseUrl = NEXTCLOUD_URL.replace(/\/$/, ''); // Remove trailing slash
		// Create auth header using user's stored credentials
		const auth = Buffer.from(
			`${fullUser.nextcloud_username}:${fullUser.nextcloud_password}`
		).toString('base64');
		const headers = {
			Authorization: `Basic ${auth}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'OCS-APIRequest': 'true'
		};
		let response;
		if (messageType === 'rich') {
			// For now, let's send as a formatted text message instead of rich object
			// Rich objects in Nextcloud Talk require specific app integration
			const taskList = project.tasks
				.map((task) => {
					const client = task.client ? ` (${task.client.name})` : '';
					const status = '📋'; // Default status icon since status field doesn't exist
					return `${status} ${task.title}${client}`;
				})
				.join('\n');

			const message =
				`🗂️ **${project.title}**\n\n` +
				`📊 **Kopsavilkums:** ${project.tasks.length} uzdevumi\n\n` +
				`📋 **Uzdevumi:**\n${taskList}\n\n` +
				`🔗 [Skatīt FastCRM](${process.env.ORIGIN || 'http://localhost:5173'}/projekti)`;

			const payload = {
				message: message
			};

			response = await fetch(`${baseUrl}/ocs/v2.php/apps/spreed/api/v1/chat/${conversationToken}`, {
				method: 'POST',
				headers: {
					...headers,
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams(payload)
			});
		} else {
			// Send as plain text message
			const taskList = project.tasks
				.map((task) => {
					const client = task.client ? ` (${task.client.name})` : '';
					const status = '📋'; // Default status icon since status field doesn't exist
					return `${status} ${task.title}${client}`;
				})
				.join('\n');
			const message =
				`🗂️ **${project.title}**\n\n` +
				`📊 **Kopsavilkums:** ${project.tasks.length} uzdevumi\n\n` +
				`📋 **Uzdevumi:**\n${taskList}\n\n` +
				`🔗 [Skatīt FastCRM](${process.env.ORIGIN || 'http://localhost:5173'}/projekti)`;

			const payload = {
				message: message
			};

			response = await fetch(`${baseUrl}/ocs/v2.php/apps/spreed/api/v1/chat/${conversationToken}`, {
				method: 'POST',
				headers: {
					...headers,
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams(payload)
			});
		}
		if (!response.ok) {
			const errorText = await response.text();
			console.error('Nextcloud Talk API error:', errorText);

			let errorMessage = 'Neizdevās nosūtīt uz Nextcloud Talk';

			// Try to parse the error for more specific messages
			try {
				const errorData = JSON.parse(errorText);
				if (errorData.ocs?.meta?.message) {
					errorMessage = errorData.ocs.meta.message;
				} else if (errorData.ocs?.meta?.statuscode === 404) {
					errorMessage = 'Saruna nav atrasta vai nav pieejama';
				} else if (errorData.ocs?.meta?.statuscode === 403) {
					errorMessage = 'Nav tiesību rakstīt šajā sarunā';
				} else if (errorData.ocs?.meta?.statuscode === 400) {
					errorMessage = 'Nepareizi dati vai saruna vairs nav aktīva';
				}
			} catch (e) {
				// If error parsing fails, use default message
			}

			return json(
				{
					error: errorMessage
				},
				{ status: response.status }
			);
		}
		const result = await response.json();
		return json({
			success: true,
			message: 'Projekts veiksmīgi nosūtīts uz Nextcloud Talk',
			data: result
		});
	} catch (error) {
		console.error('Error sharing to Nextcloud Talk:', error);
		return json(
			{
				error: 'Neizdevās nosūtīt projektu',
				details: error instanceof Error ? error.message : 'Nezināma kļūda'
			},
			{ status: 500 }
		);
	}
};
