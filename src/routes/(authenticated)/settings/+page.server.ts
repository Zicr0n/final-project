import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { Actions } from './$types'
import { eq } from "drizzle-orm";
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
    signOut: async (event) => {
        await auth.api.signOut({
            headers: event.request.headers
        });
        return redirect(302, '/login');
    },
    changePassword : async({request}) => {
        const formData = await request.formData()
        const newPassword = formData.get("newPassword")
        const currentPassword = formData.get("currentPassword") ?? ""

        if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
            throw new Error("Invalid form data");
        }

        if (newPassword === currentPassword){
            return fail(400, { error : "New Password Cannot Be Current Password"})
        }

        try {
            const data = await auth.api.changePassword({
                body: {
                    newPassword: newPassword, // required
                    currentPassword: currentPassword, // required
                    revokeOtherSessions: true,
                },
                // This endpoint requires session cookies.
                headers: request.headers,
            });

            return redirect(303, "/settings");

        } catch (error) {
            console.log(error)
            return fail(error.statusCode, {
                error: error?.body?.message
            });
        }

    },
    changeEmail : async({request}) => {

    },
};
