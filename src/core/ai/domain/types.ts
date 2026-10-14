import type { z } from "zod";
import type { aiPurposeSchema, aiUsageSchema } from "./schemas";

export type AiPurpose = z.infer<typeof aiPurposeSchema>;
export type AiUsage = z.infer<typeof aiUsageSchema>;
