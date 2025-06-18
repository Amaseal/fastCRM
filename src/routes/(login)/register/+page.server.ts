import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hash } from '@node-rs/argon2';
import { encodeBase32LowerCase } from '@oslojs/encoding';
import * as auth from '$lib/server/auth';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { userSchema } from '../schema';
import { eq, and } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	const inviteCode = url.searchParams.get('code');

	if (!inviteCode) {
		throw redirect(302, '/forbidden');
	}

	// Validate the invite code
	const validInviteCode = await db
		.select()
		.from(table.inviteCodes)
		.where(and(eq(table.inviteCodes.code, inviteCode), eq(table.inviteCodes.used, false)))
		.limit(1);

	if (validInviteCode.length === 0) {
		throw redirect(302, '/forbidden');
	}

	// Check if the code has expired
	const now = new Date();
	const expiresAt = new Date(validInviteCode[0].expiresAt);

	if (now > expiresAt) {
		throw redirect(302, '/forbidden');
	}
	const form = await superValidate(zod(userSchema));
	return { form };
};

export const actions = {
	default: async (event) => {
		const form = await superValidate(event.request, zod(userSchema));
		const inviteCode = event.url.searchParams.get('code');

		if (!form.valid) return fail(400, { form });

		// Re-validate invite code
		if (!inviteCode) {
			return fail(400, { message: 'Invalid invite code' });
		}

		const validInviteCode = await db
			.select()
			.from(table.inviteCodes)
			.where(and(eq(table.inviteCodes.code, inviteCode), eq(table.inviteCodes.used, false)))
			.limit(1);

		if (validInviteCode.length === 0) {
			return fail(400, { message: 'Invalid or used invite code' });
		}

		// Check if the code has expired
		const now = new Date();
		const expiresAt = new Date(validInviteCode[0].expiresAt);

		if (now > expiresAt) {
			return fail(400, { message: 'Invite code has expired' });
		}

		const email = form.data.email;
		const password = form.data.password;
		const name = form.data.name;

		const userId = generateUserId();
		const passwordHash = await hash(password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		try {
			await db.insert(table.user).values({ id: userId, email, password: passwordHash, name: name }); // Mark the invite code as used
			await db
				.update(table.inviteCodes)
				.set({
					used: true
				})
				.where(eq(table.inviteCodes.id, validInviteCode[0].id));

			const sessionToken = auth.generateSessionToken();
			const session = await auth.createSession(sessionToken, userId);
			auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);
		} catch (e) {
			return fail(500, { message: 'Kaut kas nogāja greizi' });
		}
		return redirect(302, '/');
	}
} satisfies Actions;

function generateUserId() {
	// ID with 120 bits of entropy, or about the same as UUID v4.
	const bytes = crypto.getRandomValues(new Uint8Array(15));
	const id = encodeBase32LowerCase(bytes);
	return id;
}
