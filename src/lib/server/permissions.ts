import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

/*
By default, there are two resources with up to six permissions.

user: create list set-role ban impersonate delete set-password
session: list revoke delete
*/

const statement = {
    ...defaultStatements,
    item: ["request", "delete", "reset", "pause", "retry", "scrape"]
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
    item: ["request", "delete", "reset", "pause", "retry", "scrape"],
    ...adminAc.statements
});

export const user = ac.newRole({
    item: ["request"]
});

export const manager = ac.newRole({
    item: ["request", "delete", "reset", "pause", "retry", "scrape"]
});
