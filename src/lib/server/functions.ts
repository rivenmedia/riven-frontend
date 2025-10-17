import { db } from "./db";
import { user } from "./schema"; // Import the user table reference

export async function getUsersCount() {
    return await db.$count(user);
}
