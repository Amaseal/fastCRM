import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hash, verify } from '@node-rs/argon2';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { setFlash } from 'sveltekit-flash-message/server';

// Schemas for form validation
const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Pašreizējā parole ir obligāta'),
		newPassword: z.string().min(6, 'Parole jāsatur vismaz 6 rakstzīmes'),
		confirmPassword: z.string().min(6, 'Paroles apstiprinājums ir obligāts')
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: 'Paroles nesakrīt',
		path: ['confirmPassword']
	});

const changeEmailSchema = z.object({
	email: z.string().email('Nederīga e-pasta adrese'),
	password: z.string().min(1, 'Parole ir obligāta')
});

const changeNameSchema = z.object({
	name: z.string().min(1, 'Vārds ir obligāts')
});

const nextcloudCredentialsSchema = z.object({
	nextcloud_username: z.string().min(1, 'Nextcloud lietotājvārds ir obligāts'),
	nextcloud_password: z.string().min(1, 'Nextcloud parole ir obligāta')
});

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Get complete user data from database using query API
	const user = await db.query.user.findFirst({
		where: eq(table.user.id, locals.user.id)
	});

	if (!user) {
		throw redirect(302, '/login');
	}
	const changePasswordForm = await superValidate(zod(changePasswordSchema));
	const changeEmailForm = await superValidate(zod(changeEmailSchema));
	const changeNameForm = await superValidate(zod(changeNameSchema));
	const nextcloudCredentialsForm = await superValidate(zod(nextcloudCredentialsSchema));

	// Pre-populate forms with current user data
	changeEmailForm.data.email = user.email;
	changeNameForm.data.name = user.name || '';
	nextcloudCredentialsForm.data.nextcloud_username = user.nextcloud_username || '';
	nextcloudCredentialsForm.data.nextcloud_password = user.nextcloud_password || '';
	return {
		user: user,
		changePasswordForm,
		changeEmailForm,
		changeNameForm,
		nextcloudCredentialsForm
	};
};

export const actions = {
	changePassword: async ({ request, locals, cookies }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const form = await superValidate(request, zod(changePasswordSchema));
		if (!form.valid) {
			return fail(400, { changePasswordForm: form });
		}

		const { currentPassword, newPassword } = form.data;

		try {
			// Verify current password using query API
			const user = await db.query.user.findFirst({
				where: eq(table.user.id, locals.user.id)
			});
			if (!user) {
				return fail(400, { changePasswordForm: form, message: 'Lietotājs nav atrasts' });
			}

			const validPassword = await verify(user.password, currentPassword);
			if (!validPassword) {
				return fail(400, { changePasswordForm: form, message: 'Pašreizējā parole ir nepareiza' });
			}

			// Hash new password
			const passwordHash = await hash(newPassword, {
				memoryCost: 19456,
				timeCost: 2,
				outputLen: 32,
				parallelism: 1
			}); // Update password
			await db
				.update(table.user)
				.set({ password: passwordHash })
				.where(eq(table.user.id, locals.user.id));

			setFlash({ type: 'success', message: 'Parole veiksmīgi nomainīta' }, cookies);
			return { changePasswordForm: form };
		} catch (error) {
			return fail(500, { changePasswordForm: form, message: 'Kļūda mainot paroli' });
		}
	},

	changeEmail: async ({ request, locals, cookies }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const form = await superValidate(request, zod(changeEmailSchema));
		if (!form.valid) {
			return fail(400, { changeEmailForm: form });
		}

		const { email, password } = form.data;
		try {
			// Verify password using query API
			const user = await db.query.user.findFirst({
				where: eq(table.user.id, locals.user.id)
			});
			if (!user) {
				return fail(400, { changeEmailForm: form, message: 'Lietotājs nav atrasts' });
			}

			const validPassword = await verify(user.password, password);
			if (!validPassword) {
				return fail(400, { changeEmailForm: form, message: 'Parole ir nepareiza' });
			}

			// Check if email is already taken using query API
			const existingUser = await db.query.user.findFirst({
				where: eq(table.user.email, email)
			});
			if (existingUser && existingUser.id !== locals.user.id) {
				return fail(400, { changeEmailForm: form, message: 'E-pasts jau tiek izmantots' });
			} // Update email
			await db.update(table.user).set({ email }).where(eq(table.user.id, locals.user.id));

			setFlash({ type: 'success', message: 'E-pasts veiksmīgi nomainīts' }, cookies);
			return { changeEmailForm: form };
		} catch (error) {
			return fail(500, { changeEmailForm: form, message: 'Kļūda mainot e-pastu' });
		}
	},

	changeName: async ({ request, locals, cookies }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const form = await superValidate(request, zod(changeNameSchema));
		if (!form.valid) {
			return fail(400, { changeNameForm: form });
		}

		const { name } = form.data;
		try {
			// Update name
			await db.update(table.user).set({ name }).where(eq(table.user.id, locals.user.id));

			setFlash({ type: 'success', message: 'Vārds veiksmīgi nomainīts' }, cookies);
			return { changeNameForm: form };
		} catch (error) {
			return fail(500, { changeNameForm: form, message: 'Kļūda mainot vārdu' });
		}
	},

	generateInviteCode: async ({ request, locals, url, cookies }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		try {
			// Generate random code
			const bytes = crypto.getRandomValues(new Uint8Array(15));
			const code = encodeBase32LowerCase(bytes);

			// Set expiration to 24 hours from now
			const expiresAt = new Date();
			expiresAt.setHours(expiresAt.getHours() + 24);

			// Insert invite code
			await db.insert(table.inviteCodes).values({
				code,
				expiresAt: expiresAt.toISOString(),
				used: false
			}); // Generate full URL
			const origin = url.origin;
			const inviteUrl = `${origin}/register?code=${code}`;

			setFlash({ type: 'success', message: 'Ielūguma kods veiksmīgi izveidots' }, cookies);
			return {
				inviteCode: code,
				inviteUrl,
				expiresAt: expiresAt.toISOString()
			};
		} catch (error) {
			return fail(500, { message: 'Kļūda ģenerējot ielūguma kodu' });
		}
	},

	saveNextcloudCredentials: async ({ request, locals, cookies }) => {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const form = await superValidate(request, zod(nextcloudCredentialsSchema));
		if (!form.valid) {
			return fail(400, { nextcloudCredentialsForm: form });
		}

		const { nextcloud_username, nextcloud_password } = form.data;
		try {
			// Update Nextcloud credentials
			await db
				.update(table.user)
				.set({
					nextcloud_username,
					nextcloud_password
				})
				.where(eq(table.user.id, locals.user.id));

			setFlash(
				{ type: 'success', message: 'Nextcloud pieteikšanās dati veiksmīgi saglabāti' },
				cookies
			);
			return { nextcloudCredentialsForm: form };
		} catch (error) {
			return fail(500, {
				nextcloudCredentialsForm: form,
				message: 'Kļūda saglabājot Nextcloud datus'
			});
		}
	}
} satisfies Actions;
