import { eq } from 'drizzle-orm';
import { product } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';

export const load = async ({ params }) => {
    const item = await db.query.product.findFirst({
        where: eq(product.id, Number(params.id))
    })

    return { item }
}

export const actions = {
    default: async ({ params, cookies }) => {
        try {
            await db.delete(product).where(eq(product.id, Number(params.id)));
        } catch (error) {
            console.error('Error deleting client:', error);
        }
        setFlash({ type: 'success', message: "Veiksmīgi izdzēsts!" }, cookies);
        redirect(303, '/produkti');
    }
};