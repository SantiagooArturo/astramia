import "server-only";
import { CHAT_LIMITS } from "@/core/reading/domain/schemas";
import { unlockReading } from "../repository/readings";

const HOUR_MS = 60 * 60 * 1000;

/** Fulfillment of `reading_unlock`. Idempotent: the window opens once. */
export async function unlockReadingService(
    userId: string,
    readingId: string,
): Promise<void> {
    await unlockReading(
        userId,
        readingId,
        new Date(Date.now() + CHAT_LIMITS.hours * HOUR_MS),
    );
}
