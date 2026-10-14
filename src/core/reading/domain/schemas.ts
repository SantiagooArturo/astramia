import { z } from "zod";
import { PRIVACY_COMMITMENTS } from "@/core/legal/domain/policies";
import { describeAnswer, LOVE_QUIZ } from "./quiz";

export const readingTopicSchema = z.enum(["amor"]);

/** How long the chat stays open and how much it can be used. */
export const CHAT_LIMITS = {
    hours: 2,
    /** "Límites razonables": caps model spend per purchase. */
    maxUserMessages: 40,
    maxMessageChars: 800,
} as const;

/** Readings an account may start per day; each one costs a teaser call. */
export const DAILY_READING_LIMIT = 5;

function yearsBetween(from: Date, to: Date): number {
    let years = to.getUTCFullYear() - from.getUTCFullYear();
    const beforeBirthday =
        to.getUTCMonth() < from.getUTCMonth() ||
        (to.getUTCMonth() === from.getUTCMonth() &&
            to.getUTCDate() < from.getUTCDate());
    if (beforeBirthday) years--;
    return years;
}

export const birthDateSchema = z.iso.date().refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
        date.getUTCFullYear() >= 1900 &&
        yearsBetween(date, new Date()) >= PRIVACY_COMMITMENTS.minimumAge
    );
}, `Debes tener al menos ${PRIVACY_COMMITMENTS.minimumAge} años`);

export const quizAnswerSchema = z.object({
    questionId: z.string(),
    optionId: z.string(),
});

export const createReadingSchema = z.object({
    topic: readingTopicSchema,
    birthDate: birthDateSchema,
    birthTime: z.iso.time({ precision: -1 }).optional(),
    birthPlace: z.string().trim().min(2).max(120).optional(),
    answers: z
        .array(quizAnswerSchema)
        .length(LOVE_QUIZ.length)
        .refine(
            (answers) =>
                new Set(answers.map((a) => a.questionId)).size ===
                    LOVE_QUIZ.length &&
                answers.every((a) => describeAnswer(a.questionId, a.optionId)),
            "Respuestas inválidas",
        ),
});

/**
 * Wire shape. `content` is `null` until the reading is unlocked *and*
 * written; the locked reading never carries it.
 */
export const readingSchema = z.object({
    id: z.string(),
    topic: readingTopicSchema,
    sunSign: z.string(),
    teaser: z.string(),
    locked: z.boolean(),
    content: z.string().nullable(),
    chatExpiresAt: z.string().nullable(),
    createdAt: z.string(),
});

export const readingIdParamsSchema = z.object({ id: z.string().min(1) });

export const chatRoleSchema = z.enum(["user", "assistant"]);

export const chatMessageSchema = z.object({
    id: z.string(),
    role: chatRoleSchema,
    content: z.string(),
    createdAt: z.string(),
});

export const chatTurnSchema = z.object({
    text: z.string().trim().min(1).max(CHAT_LIMITS.maxMessageChars),
});

export const createdReadingSchema = z.object({ id: z.string() });
