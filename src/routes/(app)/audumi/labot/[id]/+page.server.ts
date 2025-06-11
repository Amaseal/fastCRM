import { materialSchema } from '../../schema';
import { db } from '$lib/server/db';
import { material } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { eq } from 'drizzle-orm';

export const load = async ({params}) => {
    const form = await superValidate(zod(materialSchema));
        const item = await db.query.material.findFirst({
            where: eq(material.id, Number(params.id))
        })
    return { form, item}
};

export const actions = {
    default: async ({ request, params, cookies }) => {
		// First validate the form data
		const form = await superValidate(request, zod(materialSchema));

		if (!form.valid) {
			// Return validation errors if any
			return fail(400, { form });
		}
		try {

			const imageUrl = form.data.image || '';

			// Prepare update data
			const updateData = {
				title: form.data.title,
				article: form.data.article,
				width: form.data.width,
				gsm: form.data.gsm,
				remaining: form.data.remaining,
				manufacturer: form.data.manufacturer
			};

			// Only update the image field if it's not empty
			if (imageUrl) {
				Object.assign(updateData, { image: imageUrl });
			}

			// Update the material record with validated data
			await db
				.update(material)
				.set(updateData)
				.where(eq(material.id, Number(params.id)));
		} catch (error) {
			return fail(500, { form, message: 'Failed to update material' });
		}
        setFlash({ type: 'success', message: "Veiksmīgi izlabots!" }, cookies);
        redirect(303, '/audumi');
	},
};