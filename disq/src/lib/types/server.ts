export interface ServerProps {
	serverId: string;
	serverName: string;
	serverImageUrl: string;
	serverBannerImageUrl: string | null;
	serverDescription: string | null;
	serverInviteCode: string;
	isPrivateServer: boolean;
	createdAt: Date;
	updatedAt: Date;
	createdBy: string;
}

export type ServerChannelType = 'TEXT' | 'VOICE' | 'VIDEO';

export type ChannelProps = {
	channelId: string;
	channelName: string;
	channelType: ServerChannelType;
	position: number;
	isPrivateChannel: boolean;
	createdBy: string | null;
	serverId: string;
	createdAt: Date;
	updatedAt: Date;
};

export type ServerMemberRole = 'ADMIN' | 'MODERATOR' | 'GUEST';

export type MemberProps = {
	memberId: string;
	role: ServerMemberRole;
	userId: string | null;
	serverId: string;
	username: string | null;
	displayName: string | null;
	userProfileImage: string | null;
	userBannerImage: string | null;
	userEmail: string | null;
	joinedAt: Date;
	updatedAt: Date;
};

