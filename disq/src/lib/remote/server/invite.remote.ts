import { command } from '$app/server'
import { error } from '@sveltejs/kit'
import { z } from 'zod'
import { getCurrentServer } from './current-server.remote'
import { db } from '$lib/server/db'
import { and, eq } from 'drizzle-orm'
import { requireAuth } from '$lib/server/utils/session-checker';
import { serverTable } from '$lib/server/db/schema';

export const regenerateInviteCode = command(
	z.object({ serverId: z.string() }),
	async ({ serverId }) => {
		const currentUser = requireAuth();

		if (!currentUser) {
			throw error(401, 'Unauthorized')
		}

		const newInviteCode = crypto.randomUUID()

		// only admin can do it
		const result = await db.update(serverTable)
			.set({
				serverInviteCode: newInviteCode,
				updatedAt: new Date()
			})
			.where(
				and(
					eq(serverTable.serverId, serverId),
					eq(serverTable.createdBy, currentUser.id)
				)
			)
			.returning({
				serverId: serverTable.serverId,
				serverInviteCode: serverTable.serverInviteCode
			})

		if (!result || result.length === 0) {
			throw error(403, 'Server not found or you do not have permission to modify this server')
		}

		await getCurrentServer({ serverId }).refresh()

		return { serverInviteCode: result[0].serverInviteCode }
	}
)