// $lib/remote/channel/create-channel.remote.ts
import { form, query } from '$app/server';
import { error, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { requireAuth } from '$lib/server/utils/session-checker';
import { db } from '$lib/server/db';
import { channelTable, channelTypeEnum, memberRoleEnum, memberTable } from '$lib/server/db/schema';
import { getCurrentServer } from '$lib/remote/server/joined-server.remote';

import { and, eq } from 'drizzle-orm';
import { getCurrentServerChannelsList } from '$lib/remote/channel/current-channel.remote';


const getMembership = query(z.object({ serverId: z.string() }), async ({ serverId }) => {
	const currentUser = requireAuth();

	return db.query.memberTable.findFirst({
		where: and(eq(memberTable.userId, currentUser.id), eq(memberTable.serverId, serverId))
	});
});

type MemberRole = (typeof memberRoleEnum.enumValues)[number]; // 'ADMIN' | 'MODERATOR' | 'GUEST'

function hasRole(role: MemberRole, required: MemberRole): boolean {
	const levels: Record<MemberRole, number> = { ADMIN: 2, MODERATOR: 1, GUEST: 0 };
	return levels[role] >= levels[required];
}


const createChannelSchema = z.object({
	channelName: z
		.string()
		.nonempty({ message: 'Channel name is required' })
		.min(2, 'Channel name must be at least 2 characters'),
	channelType: z.enum(channelTypeEnum.enumValues).default('TEXT'),
	serverId: z.string().nonempty({ message: 'Server ID is required' }),
	isPrivateChannel: z.boolean().default(false)
});

export const createChannel = form(
	createChannelSchema,
	async ({ channelName, channelType, serverId, isPrivateChannel }) => {

		console.log(channelType);

		const currentUser = requireAuth();
		if (!currentUser) error(401, 'Unauthorized');

		// Verify user is a member and has permission to create channels
		const membership = await getMembership({ serverId });
		if (!membership) error(403, 'You are not a member of this server');

		if (!hasRole(membership.role, 'MODERATOR') || !hasRole(membership.role, 'ADMIN'))
			error(403, 'You do not have permission to create channels');

		// Prevent creating a channel named "general"
		// The "general" channel is added during server creation
		if (channelName.trim().toLowerCase() === "general")
			error(400,  'A channel named "general" already exists and cannot be duplicated')

		// Get the next position for the new channel
		const existingChannels = await db.query.channelTable.findMany({
			where: (ch, { eq }) => eq(ch.serverId, serverId),
			columns: { position: true }
		});

		const nextPosition = existingChannels.length + 1;


		let channelId;
		try {

			const [newChannel] = await db.insert(channelTable).values({
				channelName: channelName.trim(),
				channelType,
				serverId,
				isPrivateChannel: isPrivateChannel ?? false,
				position: nextPosition,
				createdBy: currentUser.id
			}).returning();

			channelId = newChannel.channelId;
		} catch (err: any) {
			if (err.message?.includes('unique')) {
				error(409, 'A channel with that name already exists in this server.');
			}
			error(500, 'Failed to create channel.');
		}

		await getCurrentServer({ serverId }).refresh();
		await getCurrentServerChannelsList({ serverId }).refresh();

		redirect(303, `/servers/${serverId}/channels/${channelId}`)
	}
);
