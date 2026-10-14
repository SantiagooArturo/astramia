import type { z } from "zod";
import type {
    chatMessageSchema,
    chatTurnSchema,
    createReadingSchema,
    quizAnswerSchema,
    readingSchema,
    readingTopicSchema,
} from "./schemas";

export type ReadingTopic = z.infer<typeof readingTopicSchema>;
export type QuizAnswer = z.infer<typeof quizAnswerSchema>;
export type CreateReading = z.infer<typeof createReadingSchema>;
export type Reading = z.infer<typeof readingSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatTurn = z.infer<typeof chatTurnSchema>;
