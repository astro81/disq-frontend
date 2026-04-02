// /servers/[serverId]/layout.server.ts

import {redirect} from '@sveltejs/kit';
import type {LayoutServerLoad} from './$types';

import {getCurrentServer} from '$lib/remote/server/current-server.remote';
import {getCurrentMember, getCurrentMemberList} from '$lib/remote/member/current-member.remote';
import { getCurrentServerChannelsList } from '$lib/remote/channel/current-channel.remote';

export const load: LayoutServerLoad = async ({ params, locals }) => {
	const { serverId } = params;

	const user = await locals.user;
	if (!user) redirect(303, '/login');

	const fetchCurrentServer = async (serverId: string) => {
		return getCurrentServer({ serverId });
	};

	const fetchCurrentMember = async (serverId: string) => {
		return getCurrentMember({ serverId });
	};

	const fetchCurrentServerMembers = async (serverId: string) => {
		return getCurrentMemberList({ serverId });
	};

	const fetchCurrentServerChannels = async (serverId: string) => {
		return getCurrentServerChannelsList({ serverId });
	};


	return {
		currentServer: await fetchCurrentServer(serverId),
		currentMember: await fetchCurrentMember(serverId),
		currentServerChannelList: await fetchCurrentServerChannels(serverId),
		currentServerMemberList: await fetchCurrentServerMembers(serverId)
	};
};
