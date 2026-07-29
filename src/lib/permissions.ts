import { z } from "zod";

export const USER_ROLES = ["user", "manager", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const userRoleSchema = z.preprocess(
    (role) => (typeof role === "string" ? role.trim().toLowerCase() : role),
    z.enum(USER_ROLES)
);

const ROLE_RANK: Record<UserRole, number> = {
    user: 0,
    manager: 1,
    admin: 2
};

export interface PermissionFlags {
    role: UserRole;
    canRequestItems: boolean;
    canManageLibrary: boolean;
    canManageSettings: boolean;
}

export function normalizeUserRole(role: string | null | undefined): UserRole {
    return userRoleSchema.catch("user").parse(role);
}

function hasRoleAtLeast(role: string | null | undefined, minimumRole: UserRole): boolean {
    const normalizedRole = normalizeUserRole(role);
    return ROLE_RANK[normalizedRole] >= ROLE_RANK[minimumRole];
}

export function getPermissionFlags(role: string | null | undefined): PermissionFlags {
    const normalizedRole = normalizeUserRole(role);

    return {
        role: normalizedRole,
        canRequestItems: hasRoleAtLeast(normalizedRole, "user"),
        canManageLibrary: hasRoleAtLeast(normalizedRole, "manager"),
        canManageSettings: hasRoleAtLeast(normalizedRole, "admin")
    };
}
