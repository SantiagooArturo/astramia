import "server-only";
import { after } from "next/server";
import { unlockReading } from "../repository/readings";
import { prepareReadingContentService } from "./ensure-reading-content-service";

/**
 * Fulfillment of `reading_unlock`. Idempotent. The paid chat hours don't
 * start here but with the first question (`sendChatMessageService`): a buyer
 * who pays at night and reads in the morning still gets them all.
 */
export async function unlockReadingService(
    userId: string,
    readingId: string,
): Promise<void> {
    await unlockReading(userId, readingId);
    // Usually written during checkout already; this covers a failed attempt
    // (no-op when the text exists or another request is writing it).
    after(() => prepareReadingContentService(userId, readingId));
}
