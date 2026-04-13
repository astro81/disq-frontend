import type { PageServerLoad } from './$types';
import { getPublicServers } from '$lib/remote/server/discover.remote';

export const load: PageServerLoad = async () => {
	return await getPublicServers();
};
