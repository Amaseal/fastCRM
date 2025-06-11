import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { loadFlash } from 'sveltekit-flash-message/server';


export const load: LayoutServerLoad = loadFlash(async ({ locals, fetch }) => {
	if (!locals.user) {
		return redirect(302, '/login');
	}

	return { user: locals.user };
});
