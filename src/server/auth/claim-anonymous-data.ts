import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import { aiUsage, orders, readings } from "@/server/drizzle/schemas";

/**
 * Hands everything an anonymous visitor owns to the account they just signed
 * up or signed in with. Runs before Better Auth deletes the anonymous user,
 * whose readings and orders would otherwise cascade away with it.
 */
export async function claimAnonymousData(
    anonymousUserId: string,
    userId: string,
): Promise<void> {
    await db.transaction(async (tx) => {
        await tx
            .update(readings)
            .set({ userId })
            .where(eq(readings.userId, anonymousUserId));
        await tx
            .update(orders)
            .set({ userId })
            .where(eq(orders.userId, anonymousUserId));
        await tx
            .update(aiUsage)
            .set({ userId })
            .where(eq(aiUsage.userId, anonymousUserId));
    });
}
