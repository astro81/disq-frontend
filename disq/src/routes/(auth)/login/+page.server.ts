import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth';
import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';


export const actions = {
    signInEmail: async ({ request }) => {
        const formData = await request.formData();
        const email = formData.get("email")?.toString() ?? "";
        const password = formData.get("password")?.toString() ?? "";

        try {
            await auth.api.signInEmail({
                body: {
                    email,
                    password,
                    callbackURL: "/servers/@me"
                }
            })
        } catch (error) {
            if (error instanceof APIError)
                return fail(400, { message: error.message || "Signin failed " })

            return fail(500, { message: "Unexpected error" });
        }

        return redirect(302, "/servers/@me");
    },

    signInGoogle: async ({ request }) => {
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

    signInGithub: async ({ request }) => {
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