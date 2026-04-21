import { query } from '$app/server';
import { db } from '$lib/server/db';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

import { dmConversationTable } from '$lib/server/db/friendship';
import { user } from '$lib/server/db/user';
import { requireAuth } from '$lib/server/utils/session-checker';


// Get or create a DM conversation between the current user and another user
export const getOrCreateDmConversation = query(
    z.object({ otherUserId: z.string() }),
    async ({ otherUserId }) => {
        const currentUser = requireAuth();

        // Normalize ordering so the same pair always maps to one row
        const [userOneId, userTwoId] =
            currentUser.id < otherUserId
                ? [currentUser.id, otherUserId]
                : [otherUserId, currentUser.id];

        // Try to find existing
        const existing = await db.query.dmConversationTable.findFirst({
            where: and(
                eq(dmConversationTable.userOneId, userOneId),
                eq(dmConversationTable.userTwoId, userTwoId)
            )
        });

        if (existing) return existing;

        // Create new
        const [conversation] = await db
            .insert(dmConversationTable)
            .values({ userOneId, userTwoId })
            .returning();

        return conversation;
    }
);


// Get friend user details for a given userId
export const getFriendUser = query(
    z.object({ friendUserId: z.string() }),
    async ({ friendUserId }) => {
        requireAuth();

        const friendUser = await db.query.user.findFirst({
            columns: {
                id: true,
                name: true,
                displayName: true,
                image: true,
                profileBannerImage: true,
                email: true,
            },
            where: eq(user.id, friendUserId)
        });

        return friendUser ?? null;
    }
);
