import { eq } from 'drizzle-orm';
import { task, taskMaterial, taskProduct, file, tab } from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import { setFlash } from 'sveltekit-flash-message/server';

export const load = async ({ params }) => {
    const item = await db.query.task.findFirst({
        where: eq(task.id, Number(params.id))
    })

    return { item }
}

export const actions = {
    default: async ({ params, fetch, cookies }) => {
        try {
            const taskId = Number(params.id);
            
            // Get the task to find the image path
            const item = await db.query.task.findFirst({
                where: eq(task.id, taskId)
            });

            if (!item) {
                setFlash({ type: 'error', message: "Projekts netika atrasts!" }, cookies);
                redirect(303, '/projekti');
            }

            // Find the "done" tab
            const doneTab = await db.query.tab.findFirst({
                where: eq(tab.title, 'done')
            });

            if (!doneTab) {
                setFlash({ type: 'error', message: "Sistēmas kļūda - nevar atrast 'done' sarakstu!" }, cookies);
                redirect(303, '/projekti');
            }

            // Delete preview image if it exists
            if (item && item.preview) {
                // Remove leading slash if present
                let imagePath = item.preview.startsWith('/') ? item.preview.slice(1) : item.preview;
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

            // Get all associated files and delete them from disk and database
            const associatedFiles = await db.query.file.findMany({
                where: eq(file.taskId, taskId)
            });

            // Delete each file from disk and database
            for (const fileRecord of associatedFiles) {
                try {
                    // Delete file from disk
                    await fetch('/api/taskfiles', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileId: fileRecord.id })
                    });
                } catch (e) {
                    console.warn(`Failed to delete file ${fileRecord.filename}:`, e);
                    // Continue with other files even if one fails
                }
            }

            // Delete related junction table records
            
            // 1. Delete task materials (junction table)
            await db.delete(taskMaterial).where(eq(taskMaterial.taskId, taskId));
            
            // 2. Delete task products (junction table)
            await db.delete(taskProduct).where(eq(taskProduct.taskId, taskId));
            
            // 3. Move task to "done" tab and clear preview
            await db
                .update(task)
                .set({ 
                    tabId: doneTab.id,
                    preview: null // Clear the preview since we deleted it
                })
                .where(eq(task.id, taskId));
            
        } catch (error) {
            console.error('Error moving task to done:', error);
            setFlash({ type: 'error', message: "Kļūda pārvietojot projektu!" }, cookies);
            redirect(303, '/projekti');
        }
        setFlash({ type: 'success', message: "Projekts veiksmīgi pārvietots uz pabeigto!" }, cookies);
        redirect(303, '/projekti');
    }
};