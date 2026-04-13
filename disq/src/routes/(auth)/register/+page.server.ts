import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth';
import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';


export const actions = {
	signUpEmail: async ({ request }) => {
		const data = await request.formData();

		const name = data.get("username")?.toString() ?? "";
		const displayName = data.get("display-name")?.toString() ?? "";
		const email = data.get("email")?.toString() ?? "";
		const password = data.get("password")?.toString() ?? "";
		const confirmPassword = data.get("confirm-password")?.toString() ?? "";

		// Confirm password
		if (password !== confirmPassword)
			return fail(400, { message: "Passwords do not match" });

		if (password.length < 8)
			return fail(400, { message: "Password must be at least 8 characters" });

		// Check username already exists
		const existingUser = await db.query.user.findFirst({
			where: eq(user.name, name)
		});

		if (existingUser)
			return fail(400, { message: "Username already taken" });

		try {
			await auth.api.signUpEmail({
				body: {
					name,
					displayName: displayName ?? name,
					email,
					password,
					callbackURL: "/servers/@me"
				}
			})
		} catch (error) {
			if (error instanceof APIError)
				return fail(400, { message: error.message || "SignUp failed " })

			console.error("Unexpected signup error:", error); // Add this
			return fail(500, { message: "Unexpected error" });
		}

		return redirect(302, "/servers/@me");
	},

	signUpGoogle: async ({ request }) => {
		const formData = await request.formData();

		const provider = formData.get("provider")?.toString() ?? "google";
		const callbackURL = formData.get("callbackURL")?.toString() ?? "/servers/@me";

		const result = await auth.api.signInSocial({
			body: {
				provider: provider as "google",
				callbackURL
			}
		});

		if (result.url) return redirect(302, result.url);

		return fail(400, { message: "Social sign-in failed" });

	},

	signUpGithub: async ({ request }) => {
		const formData = await request.formData();

		const provider = formData.get("provider")?.toString() ?? "github";
		const callbackURL = formData.get("callbackURL")?.toString() ?? "/servers/@me";

		const result = await auth.api.signInSocial({
			body: {
				provider: provider as "github",
				callbackURL
			}
		});

		if (result.url) return redirect(302, result.url);

		return fail(400, { message: "Social sign-in failed" });

	}
} satisfies Actions;