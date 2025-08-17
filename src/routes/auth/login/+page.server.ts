import { fail, redirect } from "@sveltejs/kit";
import { superValidate, message } from "sveltekit-superforms/server";
import { loginSchema, registerSchema } from "$lib/schemas/auth";
import type { Actions, PageServerLoad } from "./$types";
import { zod } from "sveltekit-superforms/adapters";
import { auth } from "$lib/server/auth";
import { APIError } from "better-auth/api";

export const load: PageServerLoad = async (event) => {
    if (event.locals.user) {
        return redirect(302, "/auth");
    }
    const loginForm = await superValidate(zod(loginSchema), {
        id: "loginForm"
    });
    const registerForm = await superValidate(zod(registerSchema), {
        id: "registerForm"
    });
    return { loginForm, registerForm };
};

export const actions: Actions = {
    login: async (event) => {
        const loginForm = await superValidate(event.request, zod(loginSchema));
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
        const registerForm = await superValidate(event.request, zod(registerSchema));
        if (!registerForm.valid) return fail(400, { registerForm });

        if (registerForm.data.password !== registerForm.data.confirmPassword) {
            return message(registerForm, "Passwords do not match", {
                status: 400
            });
        }

        try {
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
