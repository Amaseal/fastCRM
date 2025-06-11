import { db } from '$lib/server/db';
import { taskSchema } from '../schema';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { client, material, product, task } from '$lib/server/db/schema';
import { setFlash } from 'sveltekit-flash-message/server';
import { redirect } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';

export const load = async () => {
	const form = await superValidate(zod(taskSchema));
	const materials = await db.query.material.findMany({
		orderBy: [asc(material.title)]
	});

	const clients = await db.query.client.findMany({
		orderBy: [asc(client.name)]
	});

	const users = await db.query.user.findMany();
	const products = await db.query.product.findMany({
		orderBy: [asc(product.title)]
	});

	return {
		form,
		materials,
		clients,
		users,
		products
	};
};

export const actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(taskSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await db.insert(task).values({
				title: form.data.title
			});
		} catch (error) {
			return fail(500, { form, message: 'Neizdevās izveidot produktu.' });
		}
		setFlash({ type: 'success', message: 'Veiksmīgi izveidots!' }, cookies);
		redirect(303, '/produkti');
	}
};
