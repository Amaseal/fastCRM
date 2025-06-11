import { db } from '$lib/server/db';
import { tabSchema} from '../schema';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { tab} from '$lib/server/db/schema';
import { setFlash } from 'sveltekit-flash-message/server';
import { redirect } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';


export const load = async () => {
        const form = await superValidate(zod(tabSchema));
        return {
            form
        };
};

export const actions = {
    default: async ({ request, cookies }) => {
        const form = await superValidate(request, zod(tabSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        try {
            // Get the current max order value
            const result = await db.select({ maxOrder: sql`MAX([order])` }).from(tab);
            // If result[0] is undefined or maxOrder is null, use 0
            const maxOrder = result[0] && typeof result[0].maxOrder === 'number' ? result[0].maxOrder : 0;
            const nextOrder = maxOrder + 1;
            await db.insert(tab).values({
                title: form.data.title,
                color: form.data.color,
                order: nextOrder
            });
        } catch (error) {
            return fail(500, { form, message: 'Neizdevās izveidot sarakstu.' });
        }
        setFlash({ type: 'success', message: "Saraksts veiksmīgi izveidots!" }, cookies);
        redirect(303, '/projekti');
    }
};