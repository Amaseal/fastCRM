import type { RequestHandler } from '@sveltejs/kit';
import { writeFile } from 'fs/promises';
import path from 'path';
import { VITE_UPLOADS_DIR, VITE_UPLOADS_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	if (!file) {
		return new Response(JSON.stringify({ success: false, error: 'No file uploaded' }), {
			status: 400
		});
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const uploadDir = VITE_UPLOADS_DIR || 'static/uploads';
	const uploadsUrl = VITE_UPLOADS_URL || '/uploads';
	const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
	const filePath = path.join(uploadDir, fileName);

	try {
		await writeFile(filePath, buffer);
		// Always return a POSIX-style path for URLs
		const publicUrl = `${uploadsUrl.replace(/\\/g, '/')}/${fileName}`;
		return new Response(JSON.stringify({ success: true, path: publicUrl }), { status: 200 });
	} catch (e) {
		return new Response(JSON.stringify({ success: false, error: e }), { status: 500 });
	}
};
