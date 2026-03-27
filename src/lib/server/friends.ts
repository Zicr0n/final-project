import { db } from './db';
import { friendRequest } from './db/schema';
import { or, and, eq } from 'drizzle-orm';

export async function getFriendStatus(userA: string, userB: string) {
    const request = await db.query.friendRequest.findFirst({
        where: or(
            and(eq(friendRequest.senderId, userA), eq(friendRequest.receiverId, userB)),
            and(eq(friendRequest.senderId, userB), eq(friendRequest.receiverId, userA))
        )
    });

    if (!request) return "none";
    return request.status; // "pending" | "accepted" | "rejected"
}