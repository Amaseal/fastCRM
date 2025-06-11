import { eq } from 'drizzle-orm';
import { material } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';

export const load = async ({ params }) => {
    const item = await db.query.material.findFirst({
        where: eq(material.id, Number(params.id))
    })

    return { item }
}

export const actions = {
    default: async ({ params, fetch, cookies }) => {
        try {
            // Get the material to find the image path
            const item = await db.query.material.findFirst({
                where: eq(material.id, Number(params.id))
            });
            if (item && item.image) {
                // Remove leading slash if present
                let imagePath = item.image.startsWith('/') ? item.image.slice(1) : item.image;
                // Only try to delete if it's not empty
                if (imagePath) {
                    // Remove uploads/ prefix if present for API
                    imagePath = imagePath.replace(/^uploads\//, '');
                    try {
                        await fetch('/api/remove', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: imagePath })
                        });
                    } catch (e) {
                        // Ignore error, API handles file not found gracefully
                    }
                }
            }
            await db.delete(material).where(eq(material.id, Number(params.id)));
        } catch (error) {
            console.error('Error deleting client:', error);
        }
        setFlash({ type: 'success', message: "Veiksmīgi izdzēsts!" }, cookies);
        redirect(303, '/audumi');
    }
};