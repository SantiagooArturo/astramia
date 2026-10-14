import "server-only";
import { and, asc, count, eq, gte, isNull, lt, or } from "drizzle-orm";
import { db } from "@/server/drizzle/db";
import {
    type ChatMessageRow,
    chatMessages,
    type NewReadingRow,
    type ReadingRow,
    readings,
} from "@/server/drizzle/schemas/reading-schema";

export async function createReading(
    values: NewReadingRow,
): Promise<ReadingRow> {
    const [row] = await db.insert(readings).values(values).returning();
    return row;
}

/** Ownership-scoped: another user's id reads as "not found". */
export async function findReading(
    userId: string,
    id: string,
): Promise<ReadingRow | null> {
    const row = await db.query.readings.findFirst({
        where: and(eq(readings.id, id), eq(readings.userId, userId)),
    });
    return row ?? null;
}

export async function countReadingsSince(
    userId: string,
    since: Date,
): Promise<number> {
    const [row] = await db
        .select({ value: count() })
        .from(readings)
        .where(
            and(eq(readings.userId, userId), gte(readings.createdAt, since)),
        );
    return row?.value ?? 0;
}

/** Sets the unlock + chat window once; later calls change nothing. */
export async function unlockReading(
    userId: string,
    id: string,
    chatExpiresAt: Date,
): Promise<void> {
    await db
        .update(readings)
        .set({ unlockedAt: new Date(), chatExpiresAt })
        .where(
            and(
                eq(readings.id, id),
                eq(readings.userId, userId),
                isNull(readings.unlockedAt),
            ),
        );
}

/**
 * Claims the right to write the full reading. `false` when it is already
 * written or another request claimed it less than `staleBefore` ago.
 */
export async function claimReadingGeneration(
    id: string,
    staleBefore: Date,
): Promise<boolean> {
    const rows = await db
        .update(readings)
        .set({ generatingAt: new Date() })
        .where(
            and(
                eq(readings.id, id),
                isNull(readings.content),
                or(
                    isNull(readings.generatingAt),
                    lt(readings.generatingAt, staleBefore),
                ),
            ),
        )
        .returning({ id: readings.id });
    return rows.length > 0;
}

export async function saveReadingContent(
    id: string,
    content: string | null,
): Promise<void> {
    await db
        .update(readings)
        .set({ content, generatingAt: null })
        .where(eq(readings.id, id));
}

export async function listChatMessages(
    readingId: string,
): Promise<ChatMessageRow[]> {
    return db.query.chatMessages.findMany({
        where: eq(chatMessages.readingId, readingId),
        orderBy: [asc(chatMessages.createdAt)],
    });
}

/**
 * Stores a question together with its answer, so a turn the model failed to
 * answer doesn't use up one of the reading's questions.
 */
export async function addChatTurn(
    readingId: string,
    question: { content: string; askedAt: Date },
    reply: string,
): Promise<void> {
    await db.insert(chatMessages).values([
        {
            readingId,
            role: "user",
            content: question.content,
            createdAt: question.askedAt,
        },
        { readingId, role: "assistant", content: reply },
    ]);
}
