import { eq } from 'drizzle-orm';
import { file } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';

export const load = async ({ params }) => {
    const item = await db.query.file.findFirst({
        where: eq(file.id, Number(params.id)),
        with: {
            task: {
                columns: {
                    id: true,
                    title: true
                }
            }
        }
    });

    return { item };
};

export const actions = {
    default: async ({ params, fetch, cookies }) => {
        try {
            // Get the file to find the download URL/path
            const item = await db.query.file.findFirst({
                where: eq(file.id, Number(params.id))
            });
            
            if (item && item.downloadUrl) {
                // Extract the file path from the download URL
                // downloadUrl is typically like "/uploads/filename.ext"
                let filePath = item.downloadUrl.startsWith('/') ? item.downloadUrl.slice(1) : item.downloadUrl;
                
                // Remove uploads/ prefix if present for API
                filePath = filePath.replace(/^uploads\//, '');
                
                if (filePath) {
                    try {
                        await fetch('/api/remove', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: filePath })
                        });
                    } catch (e) {
                        // Ignore error, API handles file not found gracefully
                        console.warn('Could not delete physical file:', e);
                    }
                }
            }
            
            // Delete the database record
            await db.delete(file).where(eq(file.id, Number(params.id)));
            
            setFlash({ type: 'success', message: "Fails veiksmīgi izdzēsts!" }, cookies);
        } catch (error) {
            console.error('Error deleting file:', error);
            setFlash({ type: 'error', message: "Kļūda dzēšot failu!" }, cookies);
        }
        
        redirect(303, '/faili');
    }
};
