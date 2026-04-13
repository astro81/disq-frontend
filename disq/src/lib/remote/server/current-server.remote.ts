import { query } from '$app/server';
import z from 'zod';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { serverTable } from '$lib/server/db/schema';

export const getCurrentServer = query(z.object({ serverId: z.string() }), async ({ serverId }) => {

	const server = await db.query.serverTable.findFirst({
		where: eq(serverTable.serverId, serverId)
	});

	if (!server) throw new Error('Server not found');

	return server;
});
