import { form } from '$app/server';
import { error, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { UPLOAD_CONSTRAINTS } from '$lib/constants/upload';
import { requireAuth } from '$lib/server/utils/session-checker';
import {uploadToCloudinary} from "$lib/server/utils/cloudinary";
import { db } from '$lib/server/db';
import {
	channelTable,
	channelTypeEnum,
	memberRoleEnum,
	memberTable,
	serverTable
} from '$lib/server/db/schema';
import { getCurrentServer, getJoinedServers } from '$lib/remote/server/joined-server.remote';

const imageConstraints = UPLOAD_CONSTRAINTS.serverImage;
// const bannerConstraints = UPLOAD_CONSTRAINTS.serverBanner

type AllowedMimeType = (typeof imageConstraints.allowedTypes)[number];
// type AllowedBannerType = (typeof bannerConstraints.allowedTypes)[number];

const createServerSchema = 	z.object({
	serverName: z
		.string()
		.nonempty({ message: 'Server Name is required' })
		.min(3, 'Server name must be at least 3 characters'),
	serverDescription: z.string(),
	isPrivateServer: z.boolean().default(false),
	serverImage: z
		.file()
		.refine(
			(f) => imageConstraints.allowedTypes.includes(f.type as AllowedMimeType),
			`Unsupported format. Use ${imageConstraints.allowedLabel}.`
		)
		.refine(
			(f) => f.size <= imageConstraints.maxBytes,
			`File too large. Max size is ${imageConstraints.maxLabel}.`
		),
	// serverBannerImage: z
	// 	.file()
	// 	.refine(
	// 		(f) => bannerConstraints.allowedTypes.includes(f.type as AllowedBannerType),
	// 		`Unsupported format. Use ${bannerConstraints.allowedLabel}.`
	// 	)
	// 	.refine(
	// 		(f) => f.size <= bannerConstraints.maxBytes,
	// 		`File too large. Max size is ${bannerConstraints.maxLabel}.`
	// 	)
	// 	.optional()
})

export const createServer = form(
	createServerSchema,
	async ({ serverName, serverDescription, isPrivateServer, serverImage }) => {
		const user = requireAuth();
		if (!user) error(401, 'Unauthorized');

		// Upload server image (required)
		let serverImageUrl: string;
		try {
			const buffer = await serverImage.arrayBuffer();
			const result = await uploadToCloudinary(buffer, serverImage.type, {
				folder: imageConstraints.folder,
				maxBytes: imageConstraints.maxBytes
			});
			serverImageUrl = result.url;
		} catch (err) {
			error(422, err.message ?? 'Failed to upload server image.');
		}

		// Upload banner image (optional)
		// let serverBannerImageUrl: string | null = null;
		// if (serverBannerImage && serverBannerImage.size > 0) {
		// 	try {
		// 		const buffer = await serverBannerImage.arrayBuffer();
		// 		const result = await uploadToCloudinary(buffer, serverBannerImage.type, {
		// 			folder: bannerConstraints.folder,
		// 			maxBytes: bannerConstraints.maxBytes
		// 		});
		// 		serverBannerImageUrl = result.url;
		// 	} catch (err: any) {
		// 		error(422, err.message ?? 'Failed to upload banner image.');
		// 	}
		// }

		// generate invite code
		const inviteCode = crypto.randomUUID();

		let newServerId: string;
		try {
			const [server] = await db
				.insert(serverTable)
				.values({
					serverName: serverName.trim(),
					serverImageUrl,
					serverDescription: serverDescription?.trim() || null,
					serverInviteCode: inviteCode,
					isPrivateServer: isPrivateServer ?? false,
					createdBy: user.id
				})
				.returning();

			newServerId = server.serverId;

			await db.insert(memberTable).values({
				serverId: server.serverId,
				userId: user.id,
				role: memberRoleEnum.enumValues[0] // ADMIN
			});

			await db.insert(channelTable).values({
				channelName: 'general',
				channelType: channelTypeEnum.enumValues[0], // TEXT
				position: 1,
				createdBy: user.id,
				serverId: server.serverId,
				isPrivateChannel: false
			});
		} catch (err: any) {
			if (err.message?.includes('unique')) {
				error(409, 'A server with that name already exists.');
			}
			error(500, 'Failed to create server.');
		}

		await getJoinedServers().refresh();
		await getCurrentServer({ serverId: newServerId }).refresh();

		if (newServerId) redirect(303, `/servers/${newServerId}`);
		else redirect(303, '/server/@me');

	}
);
