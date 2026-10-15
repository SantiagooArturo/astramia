import { z } from "zod";
import type { Element } from "@/core/landing/domain/zodiac";
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

/** Day and month the visitor gave on the landing (`?dia=&mes=`). */
export const knownBirthDaySchema = z
    .object({
        dia: z.coerce.number().int().min(1).max(31),
        mes: z.coerce.number().int().min(1).max(12),
    })
    // 2000 is a leap year: 29 February is a valid birthday.
    .refine(
        ({ dia, mes }) => dia <= new Date(Date.UTC(2000, mes, 0)).getUTCDate(),
    )
    .transform(({ dia, mes }) => ({ day: dia, month: mes }));

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

/*
 * Computed by `chart.ts` and handed to the prompts so the model interprets
 * facts instead of inventing them. Never parsed from input; the element type
 * stays defined once, in the zodiac.
 */

export const natalPlacementSchema = z.object({
    body: z.string(),
    sign: z.string(),
    degree: z.string(),
    element: z.custom<Element>(),
    longitude: z.number(),
});

export const aspectNameSchema = z.enum([
    "conjunción",
    "sextil",
    "cuadratura",
    "trígono",
    "oposición",
]);

export const aspectSchema = z.object({
    a: z.string(),
    b: z.string(),
    name: aspectNameSchema,
    /** Degrees away from exact. */
    orb: z.number(),
});

export const natalChartSchema = z.object({
    placements: z.array(natalPlacementSchema),
    aspects: z.array(aspectSchema),
    dominantElement: z.custom<Element>().nullable(),
    moonPhase: z.string(),
    /**
     * Without a birth time the Moon (≈13°/day) may change sign that day:
     * the sign at midnight and at the end of the day. `null` when certain.
     */
    moonRange: z.object({ early: z.string(), late: z.string() }).nullable(),
});

export const skyEventSchema = z.object({ when: z.string(), text: z.string() });

export const venusOutlookSchema = z.object({
    sign: z.string(),
    retrograde: z.boolean(),
    events: z.array(skyEventSchema),
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
    birthDate: z.string(),
    /** Drawn while the full text is being written. */
    chart: natalChartSchema,
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

/** What the prompts know about the person (a reading row minus bookkeeping). */
export const readingProfileSchema = z.object({
    birthDate: z.string(),
    birthTime: z.string().nullable(),
    birthPlace: z.string().nullable(),
    answers: z.array(quizAnswerSchema),
});

/** The reading's Markdown subset, parsed into blocks for rendering. */
export const readingBlockSchema = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("heading"), text: z.string() }),
    z.object({ kind: z.literal("paragraph"), text: z.string() }),
]);
