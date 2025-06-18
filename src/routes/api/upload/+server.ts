import type { RequestHandler } from '@sveltejs/kit';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	if (!file) {
		return new Response(JSON.stringify({ success: false, error: 'No file uploaded' }), {
			status: 400
		});
	}
	const buffer = Buffer.from(await file.arrayBuffer());
	
	// In development, use static/uploads
	// In production, SvelteKit moves static contents to build root, so use uploads directly
	const uploadDir = dev ? 'static/uploads' : 'uploads';
	const uploadsUrl = '/uploads';
	const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
	const filePath = path.join(uploadDir, fileName);

	try {
		// Ensure upload directory exists
		await mkdir(uploadDir, { recursive: true });
		await writeFile(filePath, buffer);
		// Always return a POSIX-style path for URLs
		const publicUrl = `${uploadsUrl.replace(/\\/g, '/')}/${fileName}`;
		return new Response(JSON.stringify({ success: true, path: publicUrl }), { status: 200 });
	} catch (e) {
		return new Response(JSON.stringify({ success: false, error: e }), { status: 500 });
	}
};
