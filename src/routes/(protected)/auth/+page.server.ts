import type { Actions, PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { getAuthProviders } from "$lib/server/auth";
import {
    passwordChangeSchema,
    emailChangeSchema,
    setPasswordSchema,
    changeUserDataSchema,
    createUserSchema
} from "$lib/schemas/auth";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate, fail, setError } from "sveltekit-superforms";
import { auth } from "$lib/server/auth";
import { APIError } from "better-auth/api";
import { createScopedLogger } from "$lib/logger";
import { getPermissionFlags, normalizeUserRole } from "$lib/permissions";

const logger = createScopedLogger("auth-settings");

type ManagedUser = {
    id: string;
    name: string;
    email: string;
    username?: string | null;
    role?: string | null;
    banned?: boolean | null;
    createdAt?: Date | string | number | null;
};

function toIsoDateString(date: Date | string | number): string {
    if (date instanceof Date) return date.toISOString();
    if (typeof date === "number") return new Date(date).toISOString();
    return date;
}

export const load: PageServerLoad = async (event) => {
    if (!event.locals.user || !event.locals.session) {
        return redirect(302, "/auth/login");
    }

    const passwordChangeForm = await superValidate(zod4(passwordChangeSchema));
    const emailChangeForm = await superValidate(zod4(emailChangeSchema));
    const setPasswordForm = await superValidate(zod4(setPasswordSchema));
    const changeUserDataForm = await superValidate(zod4(changeUserDataSchema));
    const createUserForm = await superValidate(zod4(createUserSchema));
    const permissions = getPermissionFlags(event.locals.user.role);

    const accounts = await auth.api.listUserAccounts({
        headers: event.request.headers
    });

    const managedUsers = permissions.canManageSettings
        ? await auth.api
              .listUsers({
                  query: {
                      limit: 100,
                      sortBy: "createdAt",
                      sortDirection: "desc"
                  },
                  headers: event.request.headers
              })
              .then((result) => result.users as ManagedUser[])
              .catch((error) => {
                  logger.error("Error loading managed users:", error);
                  return [] satisfies ManagedUser[];
              })
        : [];

    return {
        user: {
            ...event.locals.user,
            role: normalizeUserRole(event.locals.user.role),
            createdAt: toIsoDateString(event.locals.user.createdAt),
            updatedAt: toIsoDateString(event.locals.user.updatedAt)
        },
        session: {
            ...event.locals.session,
            createdAt: toIsoDateString(event.locals.session.createdAt),
            updatedAt: toIsoDateString(event.locals.session.updatedAt),
            expiresAt: toIsoDateString(event.locals.session.expiresAt)
        },
        permissions,
        authProviders: getAuthProviders(),
        accounts,
        managedUsers,
        passwordChangeForm,
        emailChangeForm,
        setPasswordForm,
        changeUserDataForm,
        createUserForm
    };
};

export const actions: Actions = {
    passwordChange: async ({ request }) => {
        const passwordChangeForm = await superValidate(request, zod4(passwordChangeSchema));

        if (!passwordChangeForm.valid) return fail(400, { passwordChangeForm });

        if (passwordChangeForm.data.oldPassword === passwordChangeForm.data.newPassword) {
            return setError(
                passwordChangeForm,
                "newPassword",
                "New password must be different from old password."
            );
        }

        try {
            await auth.api.changePassword({
                body: {
                    newPassword: passwordChangeForm.data.newPassword,
                    currentPassword: passwordChangeForm.data.oldPassword,
                    revokeOtherSessions: passwordChangeForm.data.revokeSessions
                },
                headers: request.headers
            });
        } catch (error) {
            if (error instanceof APIError) {
                return message(passwordChangeForm, error.message, {
                    status: 400
                });
            }
            logger.error("Error during password change:", error);
            return message(passwordChangeForm, "An unexpected error occurred", {
                status: 500
            });
        }

        return message(passwordChangeForm, "Password changed successfully.");
    },
    setPassword: async ({ request }) => {
        const setPasswordForm = await superValidate(request, zod4(setPasswordSchema));

        if (!setPasswordForm.valid) return fail(400, { setPasswordForm });

        try {
            await auth.api.setPassword({
                body: {
                    newPassword: setPasswordForm.data.newPassword
                },
                headers: request.headers
            });
        } catch (error) {
            if (error instanceof APIError) {
                return message(setPasswordForm, error.message, {
                    status: 400
                });
            }
            logger.error("Error during setting password:", error);
            return message(setPasswordForm, "An unexpected error occurred", {
                status: 500
            });
        }

        return message(setPasswordForm, "Password set successfully.");
    },
    emailChange: async ({ request }) => {
        const emailChangeForm = await superValidate(request, zod4(emailChangeSchema));

        if (!emailChangeForm.valid) return fail(400, { emailChangeForm });

        try {
            await auth.api.changeEmail({
                body: {
                    newEmail: emailChangeForm.data.newEmail
                },
                headers: request.headers
            });
        } catch (error) {
            if (error instanceof APIError) {
                return message(emailChangeForm, error.message, {
                    status: 400
                });
            }
            logger.error("Error during email change:", error);
            return message(emailChangeForm, "An unexpected error occurred", {
                status: 500
            });
        }

        return message(emailChangeForm, "Email change request successful.");
    },
    updateUserData: async ({ request, locals }) => {
        const changeUserDataForm = await superValidate(request, zod4(changeUserDataSchema));

        if (!changeUserDataForm.valid) return fail(400, { changeUserDataForm });

        try {
            const formData = changeUserDataForm.data;

            if (formData.newUsername && formData.newUsername !== locals.user.username) {
                const usernameCheckResponse = await auth.api.isUsernameAvailable({
                    body: {
                        username: formData.newUsername
                    }
                });

                if (!usernameCheckResponse?.available) {
                    return setError(
                        changeUserDataForm,
                        "newUsername",
                        "This username is already taken."
                    );
                }
            }

            const updatePayload: Record<string, string> = {};

            if (formData.newUsername && formData.newUsername.trim() !== "") {
                updatePayload.username = formData.newUsername;
            }

            if (formData.newName && formData.newName.trim() !== "") {
                updatePayload.name = formData.newName;
            }

            if (formData.newAvatar && formData.newAvatar.trim() !== "") {
                updatePayload.image = formData.newAvatar;
            }

            if (Object.keys(updatePayload).length > 0) {
                await auth.api.updateUser({
                    body: updatePayload,
                    headers: request.headers
                });
            }
        } catch (error) {
            if (error instanceof APIError) {
                return message(changeUserDataForm, error.message, {
                    status: 400
                });
            }
            logger.error("Error during user data update:", error);
            return message(changeUserDataForm, "An unexpected error occurred", {
                status: 500
            });
        }

        return message(changeUserDataForm, "User data updated successfully.");
    },
    createUser: async ({ request, locals }) => {
        if (!getPermissionFlags(locals.user.role).canManageSettings) {
            return fail(403, { message: "Forbidden" });
        }

        const createUserForm = await superValidate(request, zod4(createUserSchema));

        if (!createUserForm.valid) return fail(400, { createUserForm });

        try {
            await auth.api.createUser({
                body: {
                    name: createUserForm.data.username,
                    email: createUserForm.data.email,
                    password: createUserForm.data.password,
                    role: normalizeUserRole(createUserForm.data.role),
                    data: {
                        username: createUserForm.data.username
                    }
                },
                headers: request.headers
            });
        } catch (error) {
            if (error instanceof APIError) {
                return message(createUserForm, error.message, {
                    status: 400
                });
            }
            logger.error("Error creating user:", error);
            return message(createUserForm, "An unexpected error occurred", {
                status: 500
            });
        }

        return message(createUserForm, "User created successfully.");
    },
    deleteManagedUser: async ({ request, locals }) => {
        if (!getPermissionFlags(locals.user.role).canManageSettings) {
            return fail(403, { message: "Forbidden" });
        }

        const formData = await request.formData();
        const userId = String(formData.get("userId") ?? "");

        if (!userId) {
            return fail(400, { message: "User id is required." });
        }

        if (userId === locals.user.id) {
            return fail(400, { message: "Use Delete Account to remove your own user." });
        }

        try {
            await auth.api.removeUser({
                body: { userId },
                headers: request.headers
            });
        } catch (error) {
            if (error instanceof APIError) {
                return fail(400, { message: error.message });
            }
            logger.error("Error deleting user:", error);
            return fail(500, { message: "An unexpected error occurred" });
        }

        return { message: "User deleted successfully." };
    }
};
