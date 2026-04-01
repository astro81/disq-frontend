// hooks.server.ts
import { sequence } from "@sveltejs/kit/hooks";
import { redirect, type Handle } from "@sveltejs/kit";
import { building } from '$app/environment';

import { svelteKitHandler } from "better-auth/svelte-kit";

import { auth } from "$lib/server/auth";
import { handleLoginRedirect } from "$lib/server/utils/login-redirect";


const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];
const PROTECTED_ROUTES = ['/servers'];

const authSessionHook: Handle = async ({ event, resolve }) => {
	// This sets cookies, headers, and internal auth state
	return svelteKitHandler({ auth, event, resolve, building });
};


// *Session + locals hook
const sessionLocalsHook: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	} else {
		delete event.locals.session;
		delete event.locals.user;
	}

	return resolve(event);
};


// *Track the last visited page
const lastPathHook: Handle = async ({ event, resolve }) => {
	if (
		!building &&                                                    // Cookies don’t exist during build
		event.request.method === 'GET' &&                               // Only track page navigations
		!AUTH_ROUTES.some((p) => event.url.pathname.startsWith(p))      // Avoid redirect loops
	) {
		event.cookies.set(
			'disq.lastPath',
			event.url.pathname + event.url.search,
			{
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: true,
				maxAge: 60 * 10     // 10 minutes
			}
		);
	}

	return resolve(event);
};


function isAuthRoute(pathname: string) {
	return AUTH_ROUTES.some(r => pathname.startsWith(r))
}

// *Redirect logged-in users away from /login
const loginRedirectHook: Handle = async ({ event, resolve }) => {

	if (!event.locals.user || !isAuthRoute(event.url.pathname))
		return resolve(event)

	// Check if there's an explicit redirectTo in the query string first
	const redirectTo = event.url.searchParams.get("redirectTo")
	if (redirectTo) throw redirect(302, decodeURIComponent(redirectTo))

  // Otherwise fall back to last visited path
	const lastPath = event.cookies.get("disq.lastPath") ?? "/servers/@me"
	throw redirect(302, lastPath)

};

function isProtectedRoute(pathname: string) {
	return PROTECTED_ROUTES.some(r => pathname.startsWith(r))
}

// !Protected routes
const protectedRoutesHook: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/servers')) {
		if (!event.locals.user || !event.locals.session) {
			throw redirect(302, handleLoginRedirect(event));
		}
	}

	if (!isProtectedRoute(event.url.pathname))
		return resolve(event)

	if (!event.locals.user || !event.locals.session)
		throw redirect(302, handleLoginRedirect(event))

	return resolve(event);
};


export const handle = sequence(
	authSessionHook,                     // !Must be first
	sessionLocalsHook,
	lastPathHook,
	loginRedirectHook,
	protectedRoutesHook,
);