import { query } from '$app/server';
import { db } from '$lib/server/db';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { serverTable, memberTable } from '$lib/server/db/server';

import { requireAuth } from '$lib/server/utils/session-checker';


// Fetch full server details for all servers the user has joined
export const getJoinedServers = query(async () => {

	const user = requireAuth();

	const joinedServers = await db
		.select({
			serverId: serverTable.serverId,
			serverName: serverTable.serverName,
			serverDescription: serverTable.serverDescription,

			serverImageUrl: serverTable.serverImageUrl,
			serverBannerImageUrl: serverTable.serverBannerImageUrl,

			serverInviteCode: serverTable.serverInviteCode,
			isPrivateServer: serverTable.isPrivateServer,

			createdAt: serverTable.createdAt,
			updatedAt: serverTable.updatedAt,
			createdBy: serverTable.createdBy
		})
		.from(memberTable)
		.innerJoin(serverTable, eq(memberTable.serverId, serverTable.serverId))
		.where(eq(memberTable.userId, user.id));

	return joinedServers ?? [];
});


export const getCurrentServer = query(z.object({ serverId: z.string() }), async ({ serverId }) => {
	const currentServer = await db.query.serverTable.findFirst({
		columns: {
			serverId: true,
			serverName: true,
			serverDescription: true,
			serverImageUrl: true,
			serverBannerImageUrl: true,
			serverInviteCode: true,
			createdBy: true,
			createdAt: true,
			updatedAt: true,
		},
		where: eq(serverTable.serverId, serverId)
	});

	if (!currentServer) throw new Error("Server not found!");

	return currentServer;
})