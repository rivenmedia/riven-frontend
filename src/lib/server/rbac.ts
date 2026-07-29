import { createHmac } from "node:crypto";
import { error } from "@sveltejs/kit";
import { getPermissionFlags, normalizeUserRole } from "$lib/permissions";

type AuthenticatedUser =
    | {
          id?: string | null;
          role?: string | null;
      }
    | null
    | undefined;

function signingPayload(userId: string, role: string, timestamp: number): string {
    return `v1\n${userId}\n${role}\n${timestamp}`;
}

export function buildBackendRoleHeaders(
    user: AuthenticatedUser,
    signingSecret: string
): Record<string, string> {
    const role = normalizeUserRole(user?.role);
    const userId = user?.id?.trim();

    if (!userId) {
        throw error(401, "Missing authenticated user");
    }

    if (!signingSecret) {
        throw error(500, "Backend auth signing secret is not configured");
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", signingSecret)
        .update(signingPayload(userId, role, timestamp))
        .digest("hex");

    const headers: Record<string, string> = {
        "x-riven-auth-source": "frontend",
        "x-riven-user-role": role,
        "x-riven-user-id": userId,
        "x-riven-auth-timestamp": String(timestamp),
        "x-riven-auth-signature": signature
    };

    return headers;
}

export function requireLibraryAccess(user: AuthenticatedUser) {
    if (!getPermissionFlags(user?.role).canManageLibrary) {
        error(403, "Forbidden");
    }
}

export function requireSettingsAccess(user: AuthenticatedUser) {
    if (!getPermissionFlags(user?.role).canManageSettings) {
        error(403, "Forbidden");
    }
}
