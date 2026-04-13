import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ params, url, fetch, locals }) => {
	const { channelId } = params;
	const cursor = url.searchParams.get('cursor');

	const userId = locals.user?.id; // however you store the current user in locals
	if (!userId) error(401, 'Unauthorized');

	let apiUrl = `${env.API_URL}/api/messages/${channelId}`;
	if (cursor) apiUrl += `?${new URLSearchParams({ cursor })}`;

	const res = await fetch(apiUrl, {
		headers: { 'x-user-id': userId }
	});

	if (!res.ok) error(res.status, await res.text());

	return json(await res.json());
};
