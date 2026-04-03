import { query } from "$app/server";
import z from "zod";
import { requireAuth } from '$lib/server/utils/session-checker';
import { db } from '$lib/server/db';
import {
	channelAccessTable,
	channelTable,
	memberRoleEnum,
	memberTable
} from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';


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

export const getChannel = query(z.object({ channelId: z.string() }), async ({ channelId }) => {

	const currentUser = requireAuth();

	const channel = await db.query.channelTable.findFirst({
		where: eq(channelTable.channelId, channelId)
	});

	if (!channel) throw Error('Channel not found');

	const membership = await getMembership(channel.serverId, currentUser.id);
	if (!membership) throw Error ('You are not a member of this server');

	if (
		channel.isPrivateChannel &&
		(!hasRole(membership.role, 'MODERATOR') || !hasRole(membership.role, 'ADMIN'))
	) {
		const access = await db.query.channelAccessTable.findFirst({
			where: and(
				eq(channelAccessTable.channelId, channelId),
				eq(channelAccessTable.memberId, membership.memberId)
			)
		});
		if (!access) throw Error('You do not have access to this channel');
	}

	return channel

})