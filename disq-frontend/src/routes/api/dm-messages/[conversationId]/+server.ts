import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ params, url, locals }) => {
    const { conversationId } = params;
    const cursor = url.searchParams.get('cursor');

    const userId = locals.user?.id;
    if (!userId) error(401, 'Unauthorized');

    let apiUrl = `${env.API_URL}/api/dm-messages/${conversationId}`;
    if (cursor) apiUrl += `?${new URLSearchParams({ cursor })}`;

    const res = await fetch(apiUrl, {
        headers: { 'x-user-id': userId }
    });

    if (!res.ok) error(res.status, await res.text());

    return json(await res.json());
};
