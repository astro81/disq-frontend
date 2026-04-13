// change-role.remote.ts
import { command } from '$app/server';
import { z } from 'zod';
import { getCurrentMember, getCurrentMemberList } from '../member/current-member.remote';
import { db } from '$lib/server/db';
import { requireAuth } from '$lib/server/utils/session-checker';
import { memberTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const changeMemberRole = command(
	z.object({
		serverId: z.string(),
		memberId: z.string(),
		role: z.enum(['ADMIN', 'MODERATOR', 'GUEST'])
	}),
	async ({ serverId, memberId, role }) => {

		const currentUser = requireAuth();

		if (!role) throw Error('Role is required');

		if (!['ADMIN', 'MODERATOR', 'GUEST'].includes(role))
			throw Error('Invalid role');

		const currentMember = await db.query.memberTable.findFirst({
			where: (m, { and, eq }) => and(eq(m.serverId, serverId), eq(m.userId, currentUser.id))
		});


		if (!currentMember)
			throw Error('You are not a member of this server');

		if (currentMember?.role !== 'ADMIN')
			throw Error('Only admins can change member roles');

		const targetMember = await db.query.memberTable.findFirst({
			where: (m, { and, eq }) => and(eq(m.serverId, serverId), eq(m.memberId, memberId))
		});

		if (!targetMember) throw Error('Member not found');

		if (targetMember?.userId === currentUser.id)
			throw Error('You cannot change your own role');

		await db.update(memberTable).set({ role }).where(eq(memberTable.memberId, memberId));

		await getCurrentMember({ serverId }).refresh();
		await getCurrentMemberList({ serverId }).refresh();

	}
);
