import type { RequestHandler } from '@sveltejs/kit';
import { unlink } from 'fs/promises';
import path from 'path';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	// In development: static/uploads, in production: uploads
	const uploadDir = env.NODE_ENV === 'production' ? 'uploads' : 'static/uploads';
	const uploadsUrl = '/uploads';
	const { path: fileName } = await request.json();
	if (!fileName) {
		return new Response(JSON.stringify({ success: false, error: 'No file path provided' }), {
			status: 400
		});
	}

	const sanitizedFileName = fileName
		.replace(new RegExp(`^${uploadsUrl}/?`), '')
		.replace(/^\/+/, '');
	const filePath = path.join(uploadDir, sanitizedFileName);

	console.log(`Attempting to delete file: ${filePath}`);
	console.log('fileName', fileName);
	try {
		await unlink(filePath);
		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} catch (e) {
		// If file does not exist, treat as success (idempotent delete)
		if (typeof e === 'object' && e !== null && 'code' in e && (e as any).code === 'ENOENT') {
			return new Response(
				JSON.stringify({ success: true, info: 'File not found, nothing to delete' }),
				{ status: 200 }
			);
		}
		return new Response(JSON.stringify({ success: false, error: 'Failed to remove file' }), {
			status: 500
		});
	}
};
