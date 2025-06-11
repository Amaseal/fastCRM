import type { RequestHandler } from '@sveltejs/kit';
import { unlink } from 'fs/promises';
import path from 'path';
import { VITE_UPLOADS_DIR, VITE_UPLOADS_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
    const uploadDir = VITE_UPLOADS_DIR || 'static/uploads';
    const uploadsUrl = VITE_UPLOADS_URL || '/uploads';
    const { path: fileName } = await request.json();
    if (!fileName) {
        return new Response(JSON.stringify({ success: false, error: 'No file path provided' }), { status: 400 });
    }
    
const sanitizedFileName = fileName.replace(new RegExp(`^${uploadsUrl}/?`), '').replace(/^\/+/, '');
const filePath = path.join(uploadDir, sanitizedFileName);

    console.log(`Attempting to delete file: ${filePath}`);
    console.log("fileName", fileName);
    try {
        await unlink(filePath);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (e) {
        // If file does not exist, treat as success (idempotent delete)
        if (typeof e === 'object' && e !== null && 'code' in e && (e as any).code === 'ENOENT') {
            return new Response(JSON.stringify({ success: true, info: 'File not found, nothing to delete' }), { status: 200 });
        }
        return new Response(JSON.stringify({ success: false, error: 'Failed to remove file' }), { status: 500 });
    }
};