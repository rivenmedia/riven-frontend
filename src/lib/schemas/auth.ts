import { z } from "zod";

export const loginSchema = z.object({
    username: z.string().min(3).max(31),
    password: z.string().min(4)
});

export const registerSchema = z.object({
    username: z.string().min(3).max(31),
    email: z.email(),
    image: z.string().optional(),
    password: z.string().min(4),
    confirmPassword: z.string().min(4)
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
