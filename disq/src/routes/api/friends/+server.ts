import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

// POST /api/friends — proxy friend actions to backend
export const POST: RequestHandler = async ({ request, url, locals }) => {
    const userId = locals.user?.id;
    if (!userId) error(401, 'Unauthorized');

    const body = await request.json();
    const action = url.searchParams.get('action');

    let apiUrl: string;

    switch (action) {
        case 'request':
            apiUrl = `${env.API_URL}/api/friends/request`;
            break;
        case 'accept':
            apiUrl = `${env.API_URL}/api/friends/accept`;
            break;
        case 'reject':
            apiUrl = `${env.API_URL}/api/friends/reject`;
            break;
        default:
            return error(400, 'Invalid action');
    }

    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) error(res.status, await res.text());

    return json(await res.json());
};

// DELETE /api/friends?friendshipId=xxx — remove a friendship
export const DELETE: RequestHandler = async ({ url, locals }) => {
    const userId = locals.user?.id;
    if (!userId) error(401, 'Unauthorized');

    const friendshipId = url.searchParams.get('friendshipId');
    if (!friendshipId) return error(400, 'friendshipId is required');

    const apiUrl = `${env.API_URL}/api/friends/${friendshipId}`;

    const res = await fetch(apiUrl, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
    });

    if (!res.ok) error(res.status, await res.text());

    return json(await res.json());
};

// GET /api/friends?type=status&targetUserId=xxx — check friendship status
export const GET: RequestHandler = async ({ url, locals }) => {
    const userId = locals.user?.id;
    if (!userId) error(401, 'Unauthorized');

    const type = url.searchParams.get('type');

    let apiUrl: string;

    if (type === 'status') {
        const targetUserId = url.searchParams.get('targetUserId');
        if (!targetUserId) return error(400, 'targetUserId is required');
        apiUrl = `${env.API_URL}/api/friends/status/${targetUserId}`;
    } else if (type === 'pending') {
        apiUrl = `${env.API_URL}/api/friends/pending`;
    } else if (type === 'search') {
        const q = url.searchParams.get('q');
        apiUrl = `${env.API_URL}/api/friends/search?q=${q}`;
    } else {
        apiUrl = `${env.API_URL}/api/friends`;
    }

    const res = await fetch(apiUrl, {
        headers: { 'x-user-id': userId }
    });

    if (!res.ok) error(res.status, await res.text());

    return json(await res.json());
};
