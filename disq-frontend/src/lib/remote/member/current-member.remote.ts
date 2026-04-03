import { query } from "$app/server";
import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import z from "zod";
import { memberTable, serverTable, user } from '$lib/server/db/schema';
import { requireAuth } from '$lib/server/utils/session-checker';

export const getCurrentMember = query(z.object({ serverId: z.string() }), async ({ serverId }) => {

	const currentUser = requireAuth();

	const server = await db.query.serverTable.findFirst({
		where: eq(serverTable.serverId, serverId)
	});

	if (!server) throw new Error('Server not found');

	const serverMember = await db.query.memberTable.findFirst({
		where: and(eq(memberTable.serverId, serverId), eq(memberTable.userId, currentUser.id))
	});

	if (!serverMember) return null;

	const memberUser = await db.query.user.findFirst({
		where: eq(user.id, serverMember.userId)
	});

	if (!memberUser) throw new Error('User not found');

	return {
		memberId: serverMember.memberId,
		userId: serverMember.userId,
		serverId: serverMember.serverId,

		username: memberUser.name,
		displayName: memberUser.displayName,

		role: serverMember.role,

		userProfileImage: memberUser.image,
		userBannerImage: memberUser.profileBannerImage,

		userEmail: memberUser.email,

		joinedAt: serverMember.createdAt,
		updatedAt: serverMember.updatedAt
	};
})


const getMembership = query(z.object({ serverId: z.string() }), async ({ serverId }) => {
	const currentUser = requireAuth()

	return db.query.memberTable.findFirst({
		where: and(eq(memberTable.userId, currentUser.id), eq(memberTable.serverId, serverId))
	});
})

	export const getCurrentMemberList = query(z.object({ serverId: z.string() }), async ({ serverId }) => {

	const server = await db.query.serverTable.findFirst({
		where: eq(serverTable.serverId, serverId)
	});

	if (!server) throw new Error('Server not found');

	const membership = await getMembership({ serverId: server.serverId });
	if (!membership) throw new Error('You are not a member of this server');

	const members = await db
		.select({
			memberId: memberTable.memberId,
			userId: memberTable.userId,
			serverId: memberTable.serverId,

			role: memberTable.role,

			username: user.name,
			displayName: user.displayName,

			userProfileImage: user.image,
			userBannerImage: user.profileBannerImage,

			userEmail: user.email,

			joinedAt: memberTable.createdAt,
			updatedAt: memberTable.updatedAt
		})
		.from(memberTable)
		.innerJoin(user, eq(memberTable.userId, user.id))
		.where(eq(memberTable.serverId, serverId));

	return members
})