import { productSchema } from '../../schema';
import { db } from '$lib/server/db';
import { client } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { product } from '$lib/server/db/schema';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { eq } from 'drizzle-orm';
import type { Product } from '$lib/server/db/schema';

export const load = async ({ params }) => {
    const form = await superValidate(zod(productSchema));
    let item = await db.query.product.findFirst({
        where: eq(client.id, Number(params.id))
    }) as Product


    return { form, item }
};

export const actions = {
    default: async ({ request, cookies, params }) => {
        const form = await superValidate(request, zod(productSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        try {
            await db
                .update(product)
                .set({
                    title: form.data.title,
                    description: form.data.description,
                    cost: form.data.cost
                })
                .where(eq(product.id, Number(params.id)));
        } catch (error) {
            return fail(500, { message: 'Internal server error' });
        }
        setFlash({ type: 'success', message: "Veiksmīgi izlabots!" }, cookies);
        redirect(303, '/produkti');
    },
};
