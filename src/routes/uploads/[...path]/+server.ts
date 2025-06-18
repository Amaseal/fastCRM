import type { RequestHandler } from '@sveltejs/kit';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import mime from 'mime-types';

// Get the uploads directory path
function getUploadsDir() {
	// Always use uploads folder at project root in both dev and production
	return 'uploads';
}

export const GET: RequestHandler = async ({ params }) => {
	const { path } = params;
	
	if (!path) {
		return new Response('Not found', { status: 404 });
	}

	// Sanitize the path to prevent directory traversal
	const sanitizedPath = path.replace(/\.\./g, '').replace(/^\/+/, '');
	const uploadsDir = getUploadsDir();
	const filePath = join(uploadsDir, sanitizedPath);

	try {
		// Check if file exists and is a file (not directory)
		const stats = await stat(filePath);
		if (!stats.isFile()) {
			return new Response('Not found', { status: 404 });
		}

		// Read the file
		const fileBuffer = await readFile(filePath);
				// Determine the MIME type
		const mimeType = mime.lookup(filePath) || 'application/octet-stream';

		// Return the file with appropriate headers
		return new Response(fileBuffer, {
			headers: {
				'Content-Type': mimeType,
				'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
			}
		});
	} catch (error) {
		console.error('Error serving file:', error);
		return new Response('Not found', { status: 404 });
	}
};
