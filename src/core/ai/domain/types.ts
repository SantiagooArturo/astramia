import type { z } from "zod";
import type {
    aiPurposeSchema,
    aiReasoningSchema,
    aiUsageContextSchema,
    aiUsageSchema,
} from "./schemas";

export type AiPurpose = z.infer<typeof aiPurposeSchema>;
export type AiReasoning = z.infer<typeof aiReasoningSchema>;
export type AiUsage = z.infer<typeof aiUsageSchema>;
export type AiUsageContext = z.infer<typeof aiUsageContextSchema>;
