import { db } from '$lib/server/db';
import { tabSchema } from '../../schema';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { tab } from '$lib/server/db/schema';
import { setFlash } from 'sveltekit-flash-message/server';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Tab } from '$lib/server/db/schema';

export const load = async ({ params }) => {
	let item = (await db.query.tab.findFirst({
		where: eq(tab.id, Number(params.id))
	})) as Tab;
	const form = await superValidate(zod(tabSchema));
	return {
		form,
		item
	};
};

export const actions = {
	default: async ({ request, cookies, params }) => {
		const form = await superValidate(request, zod(tabSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await db
				.update(tab)
				.set({
					title: form.data.title,
					color: form.data.color
				})
				.where(eq(tab.id, Number(params.id)));
		} catch (error) {
			return fail(500, { form, message: 'Neizdevās izveidot sarakstu.' });
		}
		setFlash({ type: 'success', message: 'Saraksts veiksmīgi izlabots!' }, cookies);
		redirect(303, '/projekti');
	}
};
