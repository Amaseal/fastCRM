import { materialSchema } from '../schema';
import { db } from '$lib/server/db';
import { material } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
	const form = await superValidate(zod(materialSchema));
	return { form };
};

export const actions = {
	default: async ({ request, cookies }) => {
		// First validate the form data
		const form = await superValidate(request, zod(materialSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await db.insert(material).values({
				title: form.data.title,
				article: form.data.article,
				width: form.data.width,
				gsm: form.data.gsm,
				remaining: form.data.remaining,
				manufacturer: form.data.manufacturer,
				image: form.data.image
			});
		} catch (error) {
			return fail(500, { form, message: 'Failed to add material' });
		}
		setFlash({ type: 'success', message: 'Veiksmīgi izveidots!' }, cookies);
		redirect(303, '/audumi');
	}
};
