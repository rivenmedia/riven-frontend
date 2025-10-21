import * as z from "zod";

export const loginSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters long")
        .max(15, "Username must be at most 15 characters long"),
    password: z.string().min(4, "Password must be at least 4 characters long")
});
export type LoginSchema = z.infer<typeof loginSchema>;

export const registerSchema = z
    .object({
        username: z
            .string()
            .min(3, "Username must be at least 3 characters long")
            .max(31, "Username must be at most 31 characters long"),
        email: z.email("Invalid email address"),
        image: z.string().optional(),
        password: z.string().min(4, "Password must be at least 4 characters long"),
        confirmPassword: z.string().min(4, "Confirm Password must be at least 4 characters long")
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Password and confirmation do not match.",
        path: ["confirmPassword"]
    });
export type RegisterSchema = z.infer<typeof registerSchema>;

export const passwordChangeSchema = z
    .object({
        oldPassword: z.string().nonempty("Your old password cannot be empty"),
        newPassword: z.string().min(8, "Your password must have 8 characters or more."),
        confirmNewPassword: z.string(),
        revokeSessions: z.coerce.boolean<boolean>()
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "New password and confirmation do not match.",
        path: ["confirmNewPassword"]
    });

export type PasswordChangeSchema = z.infer<typeof passwordChangeSchema>;

export const emailChangeSchema = z.object({
    newEmail: z.email("Invalid email address")
});

export type EmailChangeSchema = z.infer<typeof emailChangeSchema>;

export const setPasswordSchema = z
    .object({
        newPassword: z.string().min(8, "Your password must have 8 characters or more."),
        confirmNewPassword: z.string()
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "New password and confirmation do not match.",
        path: ["confirmNewPassword"]
    });

export type SetPasswordSchema = z.infer<typeof setPasswordSchema>;

export const changeUserDataSchema = z.object({
    newUsername: z
        .union([
            z.literal(""),
            z.string()
                .min(3, "Username must be at least 3 characters long")
                .max(31, "Username must be at most 31 characters long")
        ])
        .optional()
        .default(""),
    newName: z.string().max(100, "Name must be at most 100 characters long").optional().default(""),
    newAvatar: z
        .union([z.url("Avatar must be a valid URL"), z.literal("")])
        .optional()
        .default("")
});

export type ChangeUserDataSchema = z.infer<typeof changeUserDataSchema>;
