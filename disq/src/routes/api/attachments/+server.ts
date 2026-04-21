import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals, fetch }) => {
	const userId = locals.user?.id;  
	if (!userId) error(401, 'Unauthorized');

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	if (!file) error(400, 'No file provided');

	const outgoing = new FormData();
	outgoing.append('file', file);

	const res = await fetch(`${env.API_URL}/api/attachments`, {
		method: 'POST',
		headers: { 'x-user-id': userId },
		body: outgoing,
	});

	const body = await res.json();
	if (!res.ok) error(res.status, body.error ?? 'Upload failed');

	return Response.json(body);
};