import type {
    ChatMessage,
    Reading,
    ReadingProfile,
} from "@/core/reading/domain/types";
import type {
    ChatMessageRow,
    ReadingRow,
} from "@/server/drizzle/schemas/reading-schema";

/** Row → wire. Drops `content` while the reading is locked. */
export function toReading(row: ReadingRow): Reading {
    const locked = row.unlockedAt === null;
    return {
        id: row.id,
        topic: row.topic,
        sunSign: row.sunSign,
        teaser: row.teaser,
        locked,
        content: locked ? null : row.content,
        chatExpiresAt: row.chatExpiresAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
    };
}

export function toProfile(row: ReadingRow): ReadingProfile {
    return {
        birthDate: row.birthDate,
        birthTime: row.birthTime,
        birthPlace: row.birthPlace,
        answers: row.answers,
    };
}

export function toChatMessage(row: ChatMessageRow): ChatMessage {
    return {
        id: row.id,
        role: row.role,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
    };
}
