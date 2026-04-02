import { getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';

export type User = {
	id: string;

	email: string;
	emailVerified: boolean;

	name: string;
	displayName: string;

	image?: string | null;
	profileBannerImage?: string | null;

	createdAt: Date;
	updatedAt: Date;
};

export const requireAuth = (): User => {
	const { locals } = getRequestEvent();

	if (!locals.user || !locals.session) redirect(307, '/login');

	return locals.user;
};
