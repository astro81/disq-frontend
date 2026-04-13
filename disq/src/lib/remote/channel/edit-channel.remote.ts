import { command, query } from '$app/server';
import { z } from 'zod';
import { db } from '$lib/server/db';
import {
	channelTable,
	channelTypeEnum,
	memberTable,
	memberRoleEnum,
	channelAccessTable,
} from '$lib/server/db/schema';
import { and, asc, eq, ne } from 'drizzle-orm';
import { requireAuth } from '$lib/server/utils/session-checker';

const GENERAL_CHANNEL_NAME = 'general';


type MemberRole = (typeof memberRoleEnum.enumValues)[number]; // 'ADMIN' | 'MODERATOR' | 'GUEST'

function hasRole(role: MemberRole, required: MemberRole): boolean {
	const levels: Record<MemberRole, number> = { ADMIN: 2, MODERATOR: 1, GUEST: 0 };
	return levels[role] >= levels[required];
}

async function getMembership(serverId: string, userId: string) {
	return db.query.memberTable.findFirst({
		where: and(eq(memberTable.userId, userId), eq(memberTable.serverId, serverId)),
	});
}


export const getCurrentServerChannelsList = query(
	z.object({ serverId: z.string() }),
	async ({ serverId }) => {
		const currentUser = requireAuth();

		const membership = await getMembership(serverId, currentUser.id);
		if (!membership) throw new Error('You are not a member of this server');

		return db.query.channelTable.findMany({
			where: eq(channelTable.serverId, serverId),
			orderBy: asc(channelTable.position),
		});
	}
);

export const getChannel = query(
	z.object({ channelId: z.string() }),
	async ({ channelId }) => {
		requireAuth();

		const channel = await db.query.channelTable.findFirst({
			where: eq(channelTable.channelId, channelId),
		});

		if (!channel) throw new Error('Channel not found');

		return channel;
	}
);

export const getChannelAccessList = query(
	z.object({ channelId: z.string() }),
	async ({ channelId }) => {
		requireAuth();

		const rows = await db.query.channelAccessTable.findMany({
			where: eq(channelAccessTable.channelId, channelId),
		});

		// Return the list of memberIds that have access
		return rows.map((r) => r.memberId);
	}
);


export const editChannel = command(
	z.object({
		channelId: z.string(),
		channelName: z.string().optional(),
		channelType: z.enum(channelTypeEnum.enumValues).optional(),
		isPrivateChannel: z.boolean().optional(),
	}),
	async ({ channelId, channelName, channelType, isPrivateChannel }) => {
		const currentUser = requireAuth();

		const channel = await db.query.channelTable.findFirst({
			where: eq(channelTable.channelId, channelId),
		});

		if (!channel) throw new Error('Channel not found');

		if (channel.channelName.toLowerCase() === GENERAL_CHANNEL_NAME)
			throw new Error('The general channel cannot be edited');

		const membership = await getMembership(channel.serverId, currentUser.id);
		if (!membership) throw new Error('You are not a member of this server');

		if (!hasRole(membership.role, 'MODERATOR'))
			throw new Error('Only admins and moderators can edit channels');

		if (channelName?.trim().toLowerCase() === GENERAL_CHANNEL_NAME)
			throw new Error('Cannot rename a channel to "general"');

		const [updated] = await db
			.update(channelTable)
			.set({
				...(channelName?.trim() && { channelName: channelName.trim() }),
				...(channelType !== undefined && { channelType }),
				...(isPrivateChannel !== undefined && { isPrivateChannel }),
			})
			.where(eq(channelTable.channelId, channelId))
			.returning();

		await getCurrentServerChannelsList({ serverId: channel.serverId }).refresh();

		return updated;
	}
);

export const reorderChannel = command(
	z.object({
		channelId: z.string(),
		direction: z.enum(['up', 'down']).optional(),
		position: z.number().optional(),
	}),
	async ({ channelId, direction, position }) => {
		const currentUser = requireAuth();

		const channel = await db.query.channelTable.findFirst({
			where: eq(channelTable.channelId, channelId),
		});

		if (!channel) throw new Error('Channel not found');

		if (channel.channelName.toLowerCase() === GENERAL_CHANNEL_NAME)
			throw new Error('The general channel position cannot be changed');

		const membership = await getMembership(channel.serverId, currentUser.id);
		if (!membership) throw new Error('You are not a member of this server');

		if (!hasRole(membership.role, 'MODERATOR'))
			throw new Error('Only admins and moderators can reorder channels');

		if (direction === undefined && position === undefined)
			throw new Error('Provide direction ("up" | "down") or position');

		// All non-general channels sorted by position
		const channels = await db.query.channelTable.findMany({
			where: and(
				eq(channelTable.serverId, channel.serverId),
				ne(channelTable.channelName, GENERAL_CHANNEL_NAME)
			),
			orderBy: asc(channelTable.position),
		});

		const currentIndex = channels.findIndex((ch) => ch.channelId === channelId);
		if (currentIndex === -1) throw new Error('Channel not found in list');

		let targetIndex: number;

		if (direction === 'up') {
			targetIndex = Math.max(0, currentIndex - 1);
		} else if (direction === 'down') {
			targetIndex = Math.min(channels.length - 1, currentIndex + 1);
		} else {
			// position is 1-based; general holds slot 1, non-general start at 2
			targetIndex = Math.max(0, Math.min(channels.length - 1, position! - 2));
		}

		if (targetIndex === currentIndex) return { message: 'No change needed' };

		const swapWith = channels[targetIndex];

		await db
			.update(channelTable)
			.set({ position: swapWith.position })
			.where(eq(channelTable.channelId, channel.channelId));

		await db
			.update(channelTable)
			.set({ position: channel.position })
			.where(eq(channelTable.channelId, swapWith.channelId));

		await getCurrentServerChannelsList({ serverId: channel.serverId }).refresh();

		return { message: 'Channel reordered' };
	}
);

export const manageChannelAccess = command(
	z.object({
		channelId: z.string(),
		memberId: z.string(),
		grant: z.boolean(),
	}),
	async ({ channelId, memberId, grant }) => {
		const currentUser = requireAuth();

		const channel = await db.query.channelTable.findFirst({
			where: eq(channelTable.channelId, channelId),
		});

		if (!channel) throw new Error('Channel not found');
		if (!channel.isPrivateChannel) throw new Error('Channel is not private');

		const membership = await getMembership(channel.serverId, currentUser.id);
		if (!membership) throw new Error('You are not a member of this server');

		if (!hasRole(membership.role, 'MODERATOR'))
			throw new Error('Only admins and moderators can manage channel access');

		// Verify the target member belongs to the same server
		const targetMember = await db.query.memberTable.findFirst({
			where: and(
				eq(memberTable.memberId, memberId),
				eq(memberTable.serverId, channel.serverId)
			),
		});

		if (!targetMember) throw new Error('Member not found in this server');

		if (grant) {
			await db
				.insert(channelAccessTable)
				.values({ channelId, memberId })
				.onConflictDoNothing();
		} else {
			await db
				.delete(channelAccessTable)
				.where(
					and(
						eq(channelAccessTable.channelId, channelId),
						eq(channelAccessTable.memberId, memberId)
					)
				);
		}

		await getCurrentServerChannelsList({ serverId: channel.serverId }).refresh();

		return { message: grant ? `Access granted` : `Access revoked` };
	}
);