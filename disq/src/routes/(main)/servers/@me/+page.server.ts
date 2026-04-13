import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { uploadToCloudinary, extractPublicId, deleteFromCloudinary } from '$lib/server/utils/cloudinary';
import { UPLOAD_CONSTRAINTS } from '$lib/constants/upload';

export const load = (async ({ locals }) => {
    return { user: locals.user };
}) satisfies PageServerLoad;

export const actions = {
    updateProfile: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) return fail(401, { error: 'Unauthorized' });

        const formData = await request.formData();

        const displayName = formData.get('displayName') as string | null;
        const newUsername = (formData.get('username') as string | null)?.trim().toLowerCase();

        const avatarFile = formData.get('avatar') as File | null;
        const bannerFile = formData.get('banner') as File | null;

        const removeAvatar = formData.get('removeAvatar') === 'true';
        const removeBanner = formData.get('removeBanner') === 'true';

        if (!displayName?.trim())
            return fail(400, { error: 'Display name is required' });

        const updates: Record<string, string | null> = {
            displayName: displayName.trim()
        };

        // Validate username if changed
        if (newUsername && newUsername !== user.name) {
            if (newUsername.length < 3)
                return fail(400, { error: 'Username must be at least 3 characters' });
            if (newUsername.length > 30)
                return fail(400, { error: 'Username must be 30 characters or fewer' });
            if (!/^[a-z0-9_.]+$/.test(newUsername))
                return fail(400, { error: 'Only lowercase letters, numbers, underscores, and dots allowed' });

            const existing = await db.query.user.findFirst({
                where: eq(userTable.name, newUsername),
                columns: { id: true }
            });
            if (existing) return fail(400, { error: 'Username is already taken' });

            // Update username directly via Drizzle
            await db.update(userTable)
                .set({ name: newUsername, updatedAt: new Date() })
                .where(eq(userTable.id, user.id));
        }

        if (removeAvatar) {
            if (user.image) {
                const pid = extractPublicId(user.image);
                if (pid) await deleteFromCloudinary(pid);
            }
            updates.image = null;
        } else if (avatarFile && avatarFile.size > 0) {
            const c = UPLOAD_CONSTRAINTS.avatar;
            if (!c.allowedTypes.includes(avatarFile.type as never))
                return fail(400, { error: `Avatar must be ${c.allowedLabel}` });
            const { url } = await uploadToCloudinary(await avatarFile.arrayBuffer(), avatarFile.type, {
                folder: c.folder, publicId: `avatar-${user.id}`, maxBytes: c.maxBytes
            });
            updates.image = url;
        }

        if (removeBanner) {
            if (user.profileBannerImage) {
                const pid = extractPublicId(user.profileBannerImage);
                if (pid) await deleteFromCloudinary(pid);
            }
            updates.profileBannerImage = null;
        } else if (bannerFile && bannerFile.size > 0) {
            const c = UPLOAD_CONSTRAINTS.banner;
            if (!c.allowedTypes.includes(bannerFile.type as never))
                return fail(400, { error: `Banner must be ${c.allowedLabel}` });
            const { url } = await uploadToCloudinary(await bannerFile.arrayBuffer(), bannerFile.type, {
                folder: c.folder, publicId: `banner-${user.id}`, maxBytes: c.maxBytes
            });
            updates.profileBannerImage = url;
        }

        try {
            await auth.api.updateUser({ body: updates, headers: request.headers });
        } catch {
            return fail(500, { error: 'Failed to update profile' });
        }

        return { success: true };
    },



    updateEmail: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) return fail(401, { error: 'Unauthorized' });

        const formData = await request.formData();
        const newEmail = (formData.get('email') as string)?.trim().toLowerCase();

        if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail))
            return fail(400, { updateEmailError: 'Invalid email address' });

        if (newEmail === user.email)
            return fail(400, { updateEmailError: 'That is already your current email' });

        // Check if email is already taken
        const existing = await db.query.user.findFirst({
            where: eq(userTable.email, newEmail),
            columns: { id: true }
        });
        if (existing) return fail(400, { updateEmailError: 'Email is already in use' });

        try {
            // Update email directly via Drizzle to bypass verification
            await db.update(userTable)
                .set({ email: newEmail, emailVerified: true, updatedAt: new Date() })
                .where(eq(userTable.id, user.id));
        } catch (error) {
            console.error('DEBUG: updateEmail error:', error);
            return fail(500, { updateEmailError: 'Failed to update email' });
        }

        return { updateEmailSuccess: true };
    },

    updatePassword: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) return fail(401, { error: 'Unauthorized' });

        const formData = await request.formData();
        const currentPassword = formData.get('currentPassword') as string;
        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (!currentPassword || !newPassword || !confirmPassword)
            return fail(400, { updatePasswordError: 'All fields are required' });

        if (newPassword.length < 8)
            return fail(400, { updatePasswordError: 'Password must be at least 8 characters' });

        if (newPassword !== confirmPassword)
            return fail(400, { updatePasswordError: 'Passwords do not match' });

        try {
            await auth.api.changePassword({
                headers: request.headers,
                body: { currentPassword, newPassword, revokeOtherSessions: true }
            });
        } catch {
            return fail(500, { updatePasswordError: 'Failed to update password. Check your current password.' });
        }

        return { updatePasswordSuccess: true };
    },


    logout: async ({ request }) => {
        await auth.api.signOut({ headers: request.headers });
        redirect(302, '/login');
    },

    deleteAccount: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) return fail(401, { error: 'Unauthorized' });

        try {
            await auth.api.deleteUser({ headers: request.headers, body: {} });
        } catch {
            return fail(500, { error: 'Failed to delete account' });
        }

        redirect(302, '/login');
    },
} satisfies Actions;