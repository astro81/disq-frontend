import { query } from '$app/server';
import { z } from 'zod';
import { requireAuth } from '$lib/server/utils/session-checker';
import { db } from '$lib/server/db';
import { and, asc, eq } from 'drizzle-orm';
import { channelAccessTable, channelTable, memberRoleEnum, memberTable } from '$lib/server/db/schema';


const getMembership = query(z.object({ serverId: z.string() }), async ({ serverId }) => {
	const currentUser = requireAuth();

	return db.query.memberTable.findFirst({
		where: and(eq(memberTable.userId, currentUser.id), eq(memberTable.serverId, serverId))
	});
});


type MemberRole = typeof memberRoleEnum.enumValues[number] // 'ADMIN' | 'MODERATOR' | 'GUEST'

function hasRole(role: MemberRole, required: MemberRole): boolean {
	const levels: Record<MemberRole, number> = { ADMIN: 2, MODERATOR: 1, GUEST: 0 };
	return levels[role] >= levels[required];
}

export const getCurrentServerChannelsList = query(
	z.object({ serverId: z.string() }),
	async ({ serverId }) => {
		const membership = await getMembership({ serverId });
		if (!membership) throw new Error('You are not a member of this server');

		const channels = await db.query.channelTable.findMany({
			where: eq(channelTable.serverId, serverId),
			orderBy: asc(channelTable.position)
		});

		if (hasRole(membership.role, 'MODERATOR') || hasRole(membership.role, 'ADMIN')) return channels;

		// For guests: find which private channels they have explicit access to
		const accessRows = await db
			.select({ channelId: channelAccessTable.channelId })
			.from(channelAccessTable)
			.where(eq(channelAccessTable.memberId, membership.memberId));

		const allowedPrivateIds = new Set(accessRows.map((r) => r.channelId));

		return channels.filter((ch) => !ch.isPrivateChannel || allowedPrivateIds.has(ch.channelId));
	}
);
