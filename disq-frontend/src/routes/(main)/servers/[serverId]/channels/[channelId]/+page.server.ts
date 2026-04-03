import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {getChannel} from "$lib/remote/channel/channel.remote";


export const load: PageServerLoad = async ({ params, parent }) => {
	const { serverId, channelId } = params;
	const { currentServerChannelList, currentMember } = await parent();

	const fetchChannel = async (channelId: string) => {
		const channel = await getChannel({ channelId });
		return channel;
	};

	// Resolve streamed promises from layout
	const [channelList, member] = await Promise.all([currentServerChannelList, currentMember]);

	// Check the requested channel exists in the visible list
	const channelInList = channelList.find((ch: { channelId: string }) => ch.channelId === channelId);

	if (!channelInList) {
		const firstChannel = channelList[0];
		if (firstChannel) redirect(303, `/servers/${serverId}/channels/${firstChannel.channelId}`);
		redirect(303, `/servers/${serverId}`);
	}

	const currentChannel = await fetchChannel(channelId);

	// Channel exists in list but API denied access (e.g. private, stale list)
	if (!currentChannel) {
		const firstAccessible = channelList[0];
		if (firstAccessible)
			redirect(303, `/servers/${serverId}/channels/${firstAccessible.channelId}`);
		redirect(303, `/servers/${serverId}`);
	}

	return {
		currentChannel,
		currentChannelMember: member
	};
};
