import { eq } from 'drizzle-orm';
import { task, taskMaterial, taskProduct, file } from '$lib/server/db/schema';
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
    default: async ({ params, fetch, cookies, url }) => {
        try {
            const taskId = Number(params.id);
            
            // Get the task to find the image path
            const item = await db.query.task.findFirst({
                where: eq(task.id, taskId)
            });            if (!item) {
                setFlash({ type: 'error', message: "Projekts netika atrasts!" }, cookies);
                const searchParams = url.searchParams.toString();
                const redirectUrl = searchParams ? `/projekti?${searchParams}` : '/projekti';
                redirect(303, redirectUrl);
            }

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

            // Delete related records first (due to foreign key constraints)
            
            // 1. Delete task materials (junction table)
            await db.delete(taskMaterial).where(eq(taskMaterial.taskId, taskId));
            
            // 2. Delete task products (junction table)
            await db.delete(taskProduct).where(eq(taskProduct.taskId, taskId));
            
            // 3. Delete or update files (set taskId to null to keep files but unlink them)
            // Option A: Delete files completely
            // await db.delete(file).where(eq(file.taskId, taskId));
            
            // Option B: Keep files but unlink them from the task (recommended)
            await db.update(file).set({ taskId: null }).where(eq(file.taskId, taskId));
            
            // 4. Finally delete the main task
            await db.delete(task).where(eq(task.id, taskId));
              } catch (error) {
            console.error('Error deleting task:', error);
            setFlash({ type: 'error', message: "Kļūda dzēšot projektu!" }, cookies);
            const searchParams = url.searchParams.toString();
            const redirectUrl = searchParams ? `/projekti?${searchParams}` : '/projekti';
            redirect(303, redirectUrl);
        }
        setFlash({ type: 'success', message: "Veiksmīgi izdzēsts!" }, cookies);
        const searchParams = url.searchParams.toString();
        const redirectUrl = searchParams ? `/projekti?${searchParams}` : '/projekti';
        redirect(303, redirectUrl);
    }
};