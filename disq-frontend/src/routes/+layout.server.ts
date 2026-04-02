import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
	const user = await locals.user;

	return { user };
}) satisfies LayoutServerLoad;
