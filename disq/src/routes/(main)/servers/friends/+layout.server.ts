import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

import { getFriends, getPendingRequests } from '$lib/remote/friend/friend.remote';

export const load: LayoutServerLoad = async ({ locals }) => {
    const user = await locals.user;
    if (!user) redirect(303, '/login');

    const [friends, pendingRequests] = await Promise.all([
        getFriends(),
        getPendingRequests()
    ]);

    return {
        friends,
        pendingRequests,
        currentUser: user
    };
};
