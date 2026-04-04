import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getOrCreateDmConversation, getFriendUser } from '$lib/remote/friend/dm-conversation.remote';

export const load: PageServerLoad = async ({ params, parent }) => {
    const { friendId } = params;
    const { currentUser } = await parent();

    if (!currentUser) redirect(303, '/login');

    // Get friend's user details
    const friendUser = await getFriendUser({ friendUserId: friendId });
    if (!friendUser) redirect(303, '/servers/friends');

    // Get or create the DM conversation
    const conversation = await getOrCreateDmConversation({ otherUserId: friendId });

    return {
        friendUser,
        conversation,
        currentUser
    };
};
