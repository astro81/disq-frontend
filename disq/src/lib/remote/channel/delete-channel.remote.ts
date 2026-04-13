import { command } from '$app/server';
import z from 'zod';
import { getChannel } from '$lib/remote/channel/channel.remote';
import { db } from '$lib/server/db';
import { channelTable, memberRoleEnum, memberTable } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireAuth } from '$lib/server/utils/session-checker';
import { getCurrentServerChannelsList } from '$lib/remote/channel/current-channel.remote';


async function getMembership(serverId: string, userId: string) {

	return db.query.memberTable.findFirst({
		where: and(eq(memberTable.userId, userId), eq(memberTable.serverId, serverId))
	});
}

type MemberRole = typeof memberRoleEnum.enumValues[number] // 'ADMIN' | 'MODERATOR' | 'GUEST'

function hasRole(role: MemberRole, required: MemberRole): boolean {
	const levels: Record<MemberRole, number> = { ADMIN: 2, MODERATOR: 1, GUEST: 0 };
	return levels[role] >= levels[required];
}

export const deleteChannelRemote = command(
	z.object({ channelId: z.string() }),
	async ({ channelId }) => {

		const currentUser = requireAuth();

		// First get the channel to know the serverId for refresh
		let serverId = '';
		try {
			const channelData = await getChannel({ channelId });
			serverId = channelData.serverId;
		} catch (e) {
			console.error('Failed to get channel before delete:', e);
		}

		const channel = await db.query.channelTable.findFirst({
			where: eq(channelTable.channelId, channelId)
		});

		if (!channel) throw Error('Channel not found');

		// The general channel is permanent
		if (channel.channelName.toLowerCase() === "general")
			throw Error('The general channel cannot be deleted');

		const membership = await getMembership(channel.serverId, currentUser.id);

		if (!membership) throw Error('You are not a member of this server');

		if (!hasRole(membership.role, 'MODERATOR') || !hasRole(membership.role, 'MODERATOR'))
			throw Error('Only admins and moderators can delete channels');

		await db.delete(channelTable).where(eq(channelTable.channelId, channelId));


		// Refresh the channels list after deletion
		if (serverId)
			await getCurrentServerChannelsList({ serverId }).refresh();

	}
);
