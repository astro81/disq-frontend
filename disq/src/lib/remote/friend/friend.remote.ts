import { query } from '$app/server';
import { db } from '$lib/server/db';
import { z } from 'zod';
import { eq, and, or, desc, ilike, ne } from 'drizzle-orm';

import { friendshipTable } from '$lib/server/db/friendship';
import { user } from '$lib/server/db/user';
import { requireAuth } from '$lib/server/utils/session-checker';

// List all accepted friends for the current user
export const getFriends = query(async () => {
    const currentUser = requireAuth();

    const friendships = await db
        .select({
            friendshipId: friendshipTable.friendshipId,
            friendUserId: user.id,
            friendUsername: user.name,
            friendDisplayName: user.displayName,
            friendImage: user.image,
            friendBannerImage: user.profileBannerImage,
            createdAt: friendshipTable.createdAt
        })
        .from(friendshipTable)
        .innerJoin(
            user,
            or(
                and(
                    eq(friendshipTable.requesterId, currentUser.id),
                    eq(user.id, friendshipTable.addresseeId)
                ),
                and(
                    eq(friendshipTable.addresseeId, currentUser.id),
                    eq(user.id, friendshipTable.requesterId)
                )
            )
        )
        .where(
            and(
                eq(friendshipTable.status, 'ACCEPTED'),
                or(
                    eq(friendshipTable.requesterId, currentUser.id),
                    eq(friendshipTable.addresseeId, currentUser.id)
                )
            )
        )
        .orderBy(desc(friendshipTable.createdAt));

    return friendships ?? [];
});

// Check friendship status with a specific user
export const getFriendshipStatus = query(
    z.object({ targetUserId: z.string() }),
    async ({ targetUserId }) => {
        const currentUser = requireAuth();

        if (currentUser.id === targetUserId) {
            return { status: 'SELF' as const, friendshipId: null, isRequester: false };
        }

        const friendship = await db.query.friendshipTable.findFirst({
            where: or(
                and(
                    eq(friendshipTable.requesterId, currentUser.id),
                    eq(friendshipTable.addresseeId, targetUserId)
                ),
                and(
                    eq(friendshipTable.requesterId, targetUserId),
                    eq(friendshipTable.addresseeId, currentUser.id)
                )
            )
        });

        if (!friendship) {
            return { status: 'NONE' as const, friendshipId: null, isRequester: false };
        }

        return {
            status: friendship.status,
            friendshipId: friendship.friendshipId,
            isRequester: friendship.requesterId === currentUser.id
        };
    }
);

// List all pending incoming friend requests for the current user
export const getPendingRequests = query(async () => {
    const currentUser = requireAuth();

    const pending = await db
        .select({
            friendshipId: friendshipTable.friendshipId,
            requesterUserId: user.id,
            requesterUsername: user.name,
            requesterDisplayName: user.displayName,
            requesterImage: user.image,
            createdAt: friendshipTable.createdAt,
        })
        .from(friendshipTable)
        .innerJoin(user, eq(user.id, friendshipTable.requesterId))
        .where(
            and(
                eq(friendshipTable.addresseeId, currentUser.id),
                eq(friendshipTable.status, 'PENDING')
            )
        )
        .orderBy(desc(friendshipTable.createdAt));

    return pending ?? [];
});

// Search for users by username or display name
export const searchUsers = query(
    z.object({ query: z.string() }),
    async ({ query: text }) => {
        const currentUser = requireAuth();

        if (!text) return [];

        const users = await db
            .select({
                id: user.id,
                name: user.name,
                displayName: user.displayName,
                image: user.image
            })
            .from(user)
            .where(
                and(
                    ne(user.id, currentUser.id),
                    or(
                        ilike(user.name, `%${text}%`),
                        ilike(user.displayName, `%${text}%`)
                    )
                )
            )
            .limit(10);

        return users ?? [];
    }
);
