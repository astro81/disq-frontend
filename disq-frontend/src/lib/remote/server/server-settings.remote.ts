import { form } from '$app/server';
import { error, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { UPLOAD_CONSTRAINTS } from '$lib/constants/upload';
import { requireAuth } from '$lib/server/utils/session-checker';
import { deleteFromCloudinary, extractPublicId, uploadToCloudinary} from "$lib/server/utils/cloudinary";
import { db } from '$lib/server/db';
import {
	channelTable,
	channelTypeEnum,
	memberRoleEnum,
	memberTable,
	serverTable
} from '$lib/server/db/schema';
import { getCurrentServer, getJoinedServers } from '$lib/remote/server/joined-server.remote';
import { and, eq } from "drizzle-orm";

const imageConstraints = UPLOAD_CONSTRAINTS.serverImage;
const bannerConstraints = UPLOAD_CONSTRAINTS.serverBanner

type AllowedMimeType = (typeof imageConstraints.allowedTypes)[number];
type AllowedBannerType = (typeof bannerConstraints.allowedTypes)[number];

const updateServerSchema = 	z.object({
	serverId: z.string(),
	serverName: z.string().optional(),
	serverDescription: z.string().optional(),
	isPrivateServer: z.boolean().optional(),
	serverImage: z
		.file()
		.refine(
			(f) => imageConstraints.allowedTypes.includes(f.type as AllowedMimeType),
			`Unsupported format. Use ${imageConstraints.allowedLabel}.`
		)
		.refine(
			(f) => f.size <= imageConstraints.maxBytes,
			`File too large. Max size is ${imageConstraints.maxLabel}.`
		).optional(),
	serverBannerImage: z
		.file()
		.refine(
			(f) => bannerConstraints.allowedTypes.includes(f.type as AllowedBannerType),
			`Unsupported format. Use ${bannerConstraints.allowedLabel}.`
		)
		.refine(
			(f) => f.size <= bannerConstraints.maxBytes,
			`File too large. Max size is ${bannerConstraints.maxLabel}.`
		).optional(),
	removeImage: z.boolean().optional(),
	removeBanner: z.boolean().optional(),
})

async function requireAdmin(serverId: string, userId: string) {
	const membership = await db.query.memberTable.findFirst({
		where: and(
			eq(memberTable.serverId, serverId),
			eq(memberTable.userId, userId),
		),
		columns: { role: true },
	})
	return membership?.role === 'ADMIN'
}


export const updateServer = form(
	updateServerSchema,
	async ({
		serverId,
		serverName,
		serverDescription,
		isPrivateServer,
		serverImage,
		serverBannerImage,
		removeImage,
		removeBanner,
	}, invalid) => {

		const currentUser = requireAuth();
		if (!currentUser) error(401, 'Unauthorized');

		// authorization
		const isAdmin = await requireAdmin(serverId, currentUser.id);
		if (!isAdmin) invalid('Only server admins can edit server settings');

		// fetch current server
		const existing = await db.query.serverTable.findFirst({
			where: eq(serverTable.serverId, serverId)
		});
		if (!existing) invalid('Server not found');


		// Upload server image (required)
		let serverImageUrl: string | null = null;
		if (serverImage && serverImage.size > 0) {
			try {
				const buffer = await serverImage.arrayBuffer();
				const result = await uploadToCloudinary(buffer, serverImage.type, {
					folder: imageConstraints.folder,
					maxBytes: imageConstraints.maxBytes
				});
				serverImageUrl = result.url;
			} catch (err) {
				invalid('Failed to upload server image.');
			}
		}

		// Upload banner image (optional)
		let serverBannerImageUrl: string | null = null;
		if (serverBannerImage && serverBannerImage.size > 0) {
			try {
				const buffer = await serverBannerImage.arrayBuffer();
				const result = await uploadToCloudinary(buffer, serverBannerImage.type, {
					folder: bannerConstraints.folder,
					maxBytes: bannerConstraints.maxBytes
				});
				serverBannerImageUrl = result.url;
			} catch (err: any) {
				invalid('Failed to upload banner image.');
			}
		}

		let newImageUrl: string | null | undefined = undefined          // undefined = no change
		let newBannerUrl: string | null | undefined = undefined


		// Server icon
		if (removeImage) {
			if (existing.serverImageUrl) {
				const pid = extractPublicId(existing.serverImageUrl)
				if (pid) await deleteFromCloudinary(pid)
			}
			newImageUrl = null
		} else if (serverImage) {
			if (existing.serverImageUrl) {
				const pid = extractPublicId(existing.serverImageUrl)
				if (pid) await deleteFromCloudinary(pid)
			}
			try {
				const buffer = await serverImage.arrayBuffer()
				const { url } = await uploadToCloudinary(buffer, serverImage.type, {
					folder: UPLOAD_CONSTRAINTS.serverImage.folder,
					maxBytes: UPLOAD_CONSTRAINTS.serverImage.maxBytes,
				})
				newImageUrl = url
			} catch (err: any) {
				invalid('Server image upload failed')
			}
		}

		// Banner
		if (removeBanner) {
			if (existing.serverBannerImageUrl) {
				const pid = extractPublicId(existing.serverBannerImageUrl)
				if (pid) await deleteFromCloudinary(pid)
			}
			newBannerUrl = null
		} else if (serverBannerImage) {
			if (existing.serverBannerImageUrl) {
				const pid = extractPublicId(existing.serverBannerImageUrl)
				if (pid) await deleteFromCloudinary(pid)
			}
			try {
				const buffer = await serverBannerImage.arrayBuffer()
				const { url } = await uploadToCloudinary(buffer, serverBannerImage.type, {
					folder: UPLOAD_CONSTRAINTS.serverBanner.folder,
					maxBytes: UPLOAD_CONSTRAINTS.serverBanner.maxBytes,
				})
				newBannerUrl = url
			} catch (err: any) {
				invalid('Banner upload failed')
			}
		}

		const updates: Partial<typeof existing> = { updatedAt: new Date() };

		if (serverName !== undefined && serverName.length > 0) updates.serverName = serverName;
		if (serverDescription !== undefined) updates.serverDescription = serverDescription || null;
		if (isPrivateServer !== undefined) updates.isPrivateServer = isPrivateServer;
		if (newImageUrl !== undefined) updates.serverImageUrl = newImageUrl;
		if (newBannerUrl !== undefined) updates.serverBannerImageUrl = newBannerUrl;

		const [updated] = await db
			.update(serverTable)
			.set(updates)
			.where(eq(serverTable.serverId, serverId))
			.returning()

		await getJoinedServers().refresh();
		await getCurrentServer({ serverId }).refresh();


	}
);
