
import { clientSchema } from '../schema';
import { db } from '$lib/server/db';
import { client } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = async () => {
    const form = await superValidate(zod(clientSchema));
    return { form }
};

export const actions = {
    default: async ({ request, cookies }) => {
        const form = await superValidate(request, zod(clientSchema));
        if (!form.valid) {
            return fail(400, { form });
        }        try {
            // Convert empty strings to null for database storage
            await db.insert(client).values({
                name: form.data.name,
                email: form.data.email?.trim() || null,
                phone: form.data.phone?.trim() || null,
                description: form.data.description?.trim() || null,
                type: form.data.type
            });
        } catch (err) {

            return fail(500, { form, message: 'Neizdevās izveidot klientu.' });
        }
        setFlash({ type: 'success', message: "Veiksmīgi izveidots!" }, cookies);
        redirect(303, '/klienti');
    }
};