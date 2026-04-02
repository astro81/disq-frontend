// delete-server.remote.ts
import { form } from '$app/server';
import { db } from '$lib/server/db';
import { requireAuth, type User } from '$lib/server/utils/session-checker';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { serverTable, memberTable } from '$lib/server/db/schema';
import {getJoinedServers} from "$lib/remote/server/joined-server.remote";


export const deleteServer = form(
	z.object({
		serverId: z.string()
	}),
	async ({ serverId }, invalid) => {
		const user: User = requireAuth();

		const existingMember = await db.query.memberTable.findFirst({
			where: (m, { eq, and }) => and(eq(m.userId, user.id), eq(m.serverId, serverId))
		});

		if (!existingMember) invalid('You are not a member of this server');
		if (existingMember?.role !== 'ADMIN') invalid('Only admins can delete the server');

		if (existingMember) await db.delete(serverTable).where(eq(serverTable.serverId, serverId));

        // await getPublicServers().refresh();
        await getJoinedServers().refresh();

        redirect(303, '/servers/@me');
	}
);
