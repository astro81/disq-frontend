import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { session, account, verification, user} from "$lib/server/db/schema";

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,

	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: { user, session, account, verification }
	}),

	emailAndPassword: { enabled: true },

	user: {
		additionalFields: {
			displayName: { type: "string", required: true, },
			profileBannerImage: { type: "string", required: false, }
		}
	},

	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
			mapProfileToUser: (profile) => {
				return {
					name: profile.login,
					displayName: profile.name ?? profile.login,
					image: profile.avatar_url
				}
			}
		},
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
			mapProfileToUser: (profile) => {
				return {
					name: profile.name,
					displayName: profile.given_name ?? profile.name,
					image: profile.picture
				};
			},
		},
	},

	advanced: { database: { generateId: "uuid" } },

	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
