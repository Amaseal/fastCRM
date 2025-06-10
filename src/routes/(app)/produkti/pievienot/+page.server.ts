import { db } from '$lib/server/db';
import { productSchema } from '../schema';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { product } from '$lib/server/db/schema';
import { setFlash } from 'sveltekit-flash-message/server';
import { redirect } from '@sveltejs/kit';

export const load = async () => {
    const form = await superValidate(zod(productSchema));

    return {
        form
    };
};

export const actions = {
    default: async ({ request, cookies }) => {
        const form = await superValidate(request, zod(productSchema));

        if (!form.valid) {
            return fail(400, { form });
        }
        function convertToCents(price: number) {
            try {
                if (isNaN(price)) {
                    return fail(400, { form });
                }
                return Math.floor(price * 100);
            } catch (error) {
                return fail(400, { form });
            }
        }
        form.data.cost = Number(convertToCents(form.data.cost));
        try {
            await db.insert(product).values({
                title: form.data.title,
                description: form.data.description,
                cost: form.data.cost
            });
        } catch (error) {
            return fail(500, { form, message: 'Neizdevās izveidot produktu.' });
        }
        setFlash({ type: 'success', message: "Veiksmīgi izveidots!" }, cookies);
        redirect(303, '/produkti');
    },
}