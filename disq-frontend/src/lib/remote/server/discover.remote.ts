import { form, query } from '$app/server';
import { redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { getCurrentServer } from './current-server.remote';
import { getCurrentMember, getCurrentMemberList } from '../member/current-member.remote';
import { requireAuth } from '$lib/server/utils/session-checker';
import { db } from '$lib/server/db';
import { memberTable, serverTable } from '$lib/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { getJoinedServers } from '$lib/remote/server/joined-server.remote';

export const getPublicServers = query(async () => {
	const currentUser = requireAuth();

	const servers = await db
		.select({
			serverId: serverTable.serverId,
			serverName: serverTable.serverName,
			serverDescription: serverTable.serverDescription,

			serverImageUrl: serverTable.serverImageUrl,
			serverBannerImageUrl: serverTable.serverBannerImageUrl,

			isPrivateServer: serverTable.isPrivateServer,
			createdAt: serverTable.createdAt,
			totalMembers: sql<number>`cast(count(${memberTable.memberId}) as int)`.as('total_members')
		})
		.from(serverTable)
		.leftJoin(memberTable, eq(memberTable.serverId, serverTable.serverId))
		.where(eq(serverTable.isPrivateServer, false))
		.groupBy(serverTable.serverId)
		.orderBy(sql`count(${memberTable.memberId}) desc`);

	let joinedServerIds: string[] = [];

	if (currentUser) {
		const userId = currentUser.id;

		if (userId) {
			const memberships = await db
				.select({ serverId: memberTable.serverId })
				.from(memberTable)
				.where(eq(memberTable.userId, userId));

			joinedServerIds = memberships.map((m) => m.serverId);
		}
	}

	return { servers, joinedServerIds };
});

export const joinServer = form(z.object({ serverId: z.string() }), async ({ serverId }) => {
	const currentUser = requireAuth();

	const server = await db.query.serverTable.findFirst({
		where: eq(serverTable.serverId, serverId)
	});

	if (!server) throw Error('Server not found');
	if (server.isPrivateServer) throw Error('This server is private. Cannot join.');

	const existing = await db.query.memberTable.findFirst({
		where: and(eq(memberTable.serverId, serverId), eq(memberTable.userId, currentUser.id))
	});

	if (existing) throw Error('Already a member of this server');

	await db.insert(memberTable).values({
		serverId,
		userId: currentUser.id,
		role: 'GUEST'
	});

	await getJoinedServers().refresh();
	await getCurrentServer({ serverId }).refresh();
	await getPublicServers().refresh();
	await getCurrentMember({ serverId }).refresh();
	await getCurrentMemberList({ serverId }).refresh();

	redirect(302, `/servers/${serverId}`);
});
