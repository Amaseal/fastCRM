import { redirect, type Cookies, type RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { superValidate, fail } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { eq } from 'drizzle-orm';
import * as table from '$lib/server/db/schema';
import { verify } from '@node-rs/argon2';
import { userSchema } from '../schema';
import { db } from '$lib/server/db';
import * as auth from '$lib/server/auth';
import { setFlash } from 'sveltekit-flash-message/server';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		return redirect(302, '/');
	}
	const form = await superValidate(zod(userSchema));
	return { form };
};

export const actions = {
	default: async (event) => {
		const { cookies } = event;
		const form = await superValidate(event.request, zod(userSchema));
		console.log(form.valid)
		if (!form.valid) {
			return fail(400, { form });
		}

		const email = form.data.email;
		const password = form.data.password;

		const results = await db.select().from(table.user).where(eq(table.user.email, email));

		const existingUser = results.at(0);
		if (!existingUser) {
			setFlash({ type: 'error', message: 'Šāds lietotājs nepastāv!' }, cookies);
			return fail(400, { message: 'Nepareizs epasts vai parole', form });
		}

		const validPassword = await verify(existingUser.password, password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		if (!validPassword) {
			setFlash({ type: 'error', message: 'Nepareiza parole!' }, cookies);
			return fail(400, { message: 'Nepareizs epasts vai parole', form });
		}

		const sessionToken = auth.generateSessionToken();
		const session = await auth.createSession(sessionToken, existingUser.id);
		auth.setSessionTokenCookie(event, sessionToken, session.expiresAt);

		return redirect(302, '/');
	}
} satisfies Actions;
