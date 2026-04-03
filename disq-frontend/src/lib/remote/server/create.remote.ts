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
})

export const createServer = form(
	createServerSchema,
	async ({ serverName, serverDescription, isPrivateServer, serverImage }) => {
		const user = requireAuth();
		if (!user) error(401, 'Unauthorized');

		console.log("create-remote", serverName, serverDescription, isPrivateServer, serverImage);

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

		console.log("create-remote", serverImageUrl);

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

			console.log("create-remote", server);

			newServerId = server.serverId;

			const [member] = await db.insert(memberTable).values({
				serverId: server.serverId,
				userId: user.id,
				role: memberRoleEnum.enumValues[0] // ADMIN
			}).returning();

			console.log("create-remote", member);

			const [channel] = await db.insert(channelTable).values({
				channelName: 'general',
				channelType: channelTypeEnum.enumValues[0], // TEXT
				position: 1,
				createdBy: user.id,
				serverId: server.serverId,
				isPrivateChannel: false
			}).returning();

			console.log('create-remote', channel);
		} catch (err: any) {
			if (err.message?.includes('unique')) {
				error(409, 'A server with that name already exists.');
			}
			error(500, 'Failed to create server.');
		}

		if (newServerId) redirect(303, `/servers/${newServerId}`);
		else redirect(303, '/server/@me');

	}
);
