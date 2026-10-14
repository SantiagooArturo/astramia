import { z } from "zod";

/** What a model call was for; the unit cost is reported by. */
export const aiPurposeSchema = z.enum(["teaser", "reading", "chat"]);

/** Hidden reasoning before answering (AI SDK's provider-agnostic levels). */
export const aiReasoningSchema = z.enum([
    "none",
    "minimal",
    "low",
    "medium",
    "high",
]);

/** Who a call is billed to in `ai_usage`. */
export const aiUsageContextSchema = z.object({
    purpose: aiPurposeSchema,
    userId: z.string().nullable(),
    referenceId: z.string().nullable(),
});

/** The slice of a call's outcome we keep for cost accounting. */
export const aiUsageSchema = z.object({
    model: z.string(),
    inputTokens: z.number().int().nonnegative().nullable(),
    outputTokens: z.number().int().nonnegative().nullable(),
    costUsd: z.number().nonnegative().nullable(),
});

/** Which models the Gateway tried for a call; the last success answered it. */
export const gatewayRoutingMetadataSchema = z.object({
    gateway: z.object({
        routing: z.object({
            modelAttempts: z.array(
                z.object({ canonicalSlug: z.string(), success: z.boolean() }),
            ),
        }),
    }),
});

/** AI Gateway reports cost per generation under `providerMetadata.gateway`. */
export const gatewayCostMetadataSchema = z.object({
    gateway: z.object({ cost: z.coerce.number().nonnegative() }),
});
