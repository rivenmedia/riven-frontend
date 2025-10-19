import { fail, redirect } from "@sveltejs/kit";
import { superValidate, message } from "sveltekit-superforms/server";
import { loginSchema, registerSchema } from "$lib/schemas/auth";
import type { Actions, PageServerLoad } from "./$types";
import { zod4 } from "sveltekit-superforms/adapters";
import { auth } from "$lib/server/auth";
import { APIError } from "better-auth/api";
import { getUsersCount } from "$lib/server/functions";
import { getAuthProviders } from "$lib/server/auth";

const authProviders = getAuthProviders();

export const load: PageServerLoad = async (event) => {
    if (event.locals.user) {
        return redirect(302, "/auth");
    }
    const loginForm = await superValidate(zod4(loginSchema), {
        id: "loginForm"
    });
    const registerForm = await superValidate(zod4(registerSchema), {
        id: "registerForm"
    });
    return { loginForm, registerForm, authProviders: authProviders };
};

async function noUserExists() {
    const count = await getUsersCount();
    return count === 0;
}

export const actions: Actions = {
    login: async (event) => {
        const loginForm = await superValidate(event.request, zod4(loginSchema));
        if (!loginForm.valid) return fail(400, { loginForm });

        try {
            const data = await auth.api.signInUsername({
                body: {
                    username: loginForm.data.username,
                    password: loginForm.data.password,
                    callbackURL: "/"
                },
                headers: event.request.headers
            });

            console.log("Login response:", data);
        } catch (error) {
            if (error instanceof APIError) {
                return message(loginForm, error.message, {
                    status: 400
                });
            }
            console.error("Error during login:", error);
            return message(loginForm, "An unexpected error occurred", {
                status: 500
            });
        }

        return redirect(303, "/");
    },
    register: async (event) => {
        const registerForm = await superValidate(event.request, zod4(registerSchema));
        if (!registerForm.valid) return fail(400, { registerForm });

        if (registerForm.data.password !== registerForm.data.confirmPassword) {
            return message(registerForm, "Passwords do not match", {
                status: 400
            });
        }

        try {
            const isFirstUser = await noUserExists();
            if (isFirstUser) {
                console.log("No users exist, assigning admin role to the first registered user.");

                const data = await auth.api.createUser({
                    body: {
                        name: registerForm.data.username,
                        email: registerForm.data.email,
                        password: registerForm.data.password,
                        role: ["admin"],
                        data: {
                            username: registerForm.data.username,
                            image: registerForm.data.image || undefined
                        }
                    }
                });

                console.log("First user (admin) created:", data);

                const signInData = await auth.api.signInUsername({
                    body: {
                        username: registerForm.data.username,
                        password: registerForm.data.password,
                        callbackURL: "/"
                    },
                    headers: event.request.headers
                });

                console.log("Login response for first user:", signInData);
            } else {
                const data = await auth.api.signUpEmail({
                    body: {
                        name: registerForm.data.username,
                        username: registerForm.data.username,
                        email: registerForm.data.email,
                        password: registerForm.data.password,
                        image: registerForm.data.image || undefined
                    }
                });

                console.log("Sign up response:", data);
            }
        } catch (error) {
            if (error instanceof APIError) {
                return message(registerForm, error.message, {
                    status: 400
                });
            }
            console.error("Error during sign up:", error);
            return message(registerForm, "An unexpected error occurred", {
                status: 500
            });
        }

        return redirect(303, "/");
    }
};
