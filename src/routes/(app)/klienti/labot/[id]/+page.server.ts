import { clientSchema } from '../../schema';
import { db } from '$lib/server/db';
import { client } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { eq } from 'drizzle-orm';

export const load = async ({ params }) => {
    const item = await db.query.client.findFirst({
        where: eq(client.id, Number(params.id))
    });
    
    if (!item) {
        throw new Error('Client not found');
    }
    
    // Transform null values to undefined for form compatibility
    const formData = {
        id: item.id,
        name: item.name,
        email: item.email ?? undefined,
        phone: item.phone ?? undefined,
        description: item.description ?? undefined,
        type: item.type
    };
    
    const form = await superValidate(formData, zod(clientSchema));
    return { form, item };
};


export const actions = {
    default: async ({ request, cookies, params }) => {
        const form = await superValidate(request, zod(clientSchema));

        if (!form.valid) {
            return fail(400, { form });
        }        try {
            // Convert empty strings to null for database storage
            await db
                .update(client)
                .set({
                    name: form.data.name,
                    email: form.data.email?.trim() || null,
                    phone: form.data.phone?.trim() || null,
                    description: form.data.description?.trim() || null,
                    type: form.data.type
                })
                .where(eq(client.id, Number(params.id)));
        } catch (err) {
            return fail(500, { form, message: 'Neizdevās izlabot klientu.' });
        }
        setFlash({ type: 'success', message: "Veiksmīgi izlabots!" }, cookies);
        redirect(303, '/klienti');
    },
};