import "server-only";
import { after } from "next/server";
import { CHAT_LIMITS } from "@/core/reading/domain/schemas";
import { unlockReading } from "../repository/readings";
import { prepareReadingContentService } from "./ensure-reading-content-service";

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
    // Usually written during checkout already; this covers a failed attempt
    // (no-op when the text exists or another request is writing it).
    after(() => prepareReadingContentService(userId, readingId));
}
