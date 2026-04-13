// leave-server.remote.ts
import { form } from "$app/server";
import { error, redirect } from "@sveltejs/kit";
import z from "zod";
import { requireAuth } from '$lib/server/utils/session-checker';
import { db } from '$lib/server/db';
import { memberTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getPublicServers } from '$lib/remote/server/discover.remote';
import { getJoinedServers } from '$lib/remote/server/joined-server.remote';

export const leaveServer = form(
	z.object({
		serverId: z.string()
	}),
	async ({ serverId }, invalid) => {

		const currentUser = requireAuth();

		if (!serverId) error(404, "Server not found");

		const existingMember = await db.query.memberTable.findFirst({
			where: (m, { eq, and }) =>
				and(eq(m.userId, currentUser.id), eq(m.serverId, serverId))
		});

		if (!existingMember)
			invalid('You are not a member of this server');

		if (existingMember?.role === 'ADMIN')
			invalid('Admins cannot leave the server');

		if (existingMember)
			await db.delete(memberTable).where(eq(memberTable.memberId, existingMember.memberId));

		await getPublicServers().refresh();
		await getJoinedServers().refresh();

		redirect(303, "/servers/@me");
	}
);