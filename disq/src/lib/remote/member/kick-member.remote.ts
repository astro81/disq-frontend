// kick-member.remote.ts
import { command } from '$app/server';
import { z } from 'zod';
import { getCurrentMember, getCurrentMemberList } from '../member/current-member.remote';
import { getPublicServers } from '../server/discover.remote';
import { requireAuth } from '$lib/server/utils/session-checker';
import { db } from '$lib/server/db';
import { memberTable } from '$lib/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export const kickServerMember = command(
	z.object({
		serverId: z.string(),
		memberId: z.string()
	}),
	async ({ serverId, memberId }) => {

		const currentUser = requireAuth();

		const currentMember = await db.query.memberTable.findFirst({
			where: (m, { and, eq }) => and(eq(m.serverId, serverId), eq(m.userId, currentUser.id))
		});

		if (!currentMember) throw Error('You are not a member of this server');

		if (!['ADMIN', 'MODERATOR'].includes(currentMember.role))
			throw Error('You do not have permission to kick members');

		const targetMember = await db.query.memberTable.findFirst({
			where: (m, { and, eq }) => and(eq(m.serverId, serverId), eq(m.memberId, memberId))
		});


		if (!targetMember) throw Error('Member not found');

		if (targetMember.userId === currentUser.id)
			throw Error('You cannot kick yourself');

		if (currentMember.role === 'MODERATOR' && targetMember.role === 'ADMIN')
			throw Error('Moderators cannot kick admins');

		if (targetMember.role === 'ADMIN') {
			const [{ count }] = await db
				.select({ count: sql<number>`count(*)` })
				.from(memberTable)
				.where(and(eq(memberTable.serverId, serverId), eq(memberTable.role, 'ADMIN')));

			if (count <= 1) throw Error('Server must have at least one admin');
		}

		await db
			.delete(memberTable)
			.where(and(eq(memberTable.memberId, memberId), eq(memberTable.serverId, serverId)));

		await getPublicServers().refresh();
		await getCurrentMember({ serverId }).refresh();
		await getCurrentMemberList({ serverId }).refresh();
	}
);
