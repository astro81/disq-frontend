import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {requireAuth} from "$lib/server/utils/session-checker";
import { db } from "$lib/server/db";
import { memberTable, serverTable } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const load = (async ({ params }) => {
	const currentUser = requireAuth();

	const { inviteCode } = params;

	// First, find the server by invite code
	const server = await db.query.serverTable.findFirst({
		where: eq(serverTable.serverInviteCode, inviteCode),
		columns: {
			serverId: true,
			serverName: true,
			isPrivateServer: true
		}
	});

	if (!server) throw new Error('Invalid or expired invite link');

	// Check if user is already a member
	const existingMember = await db.query.memberTable.findFirst({
		where: and(eq(memberTable.serverId, server.serverId), eq(memberTable.userId, currentUser.id)),
		columns: {
			memberId: true,
			serverId: true
		}
	});

	// If already a member, return the server info
	if (existingMember) redirect(303, `/servers/${server.serverId}`);

	// Add the user as a member
	await db.insert(memberTable).values({
		userId: currentUser.id,
		serverId: server.serverId,
		role: 'GUEST' // Default role
	});

	redirect(303, `/servers/${server.serverId}`);


}) satisfies PageServerLoad;