import "server-only";
import { getLogger } from "@logtape/logtape";
import { generateText, type ModelMessage, streamText } from "ai";
import { gatewayCostMetadataSchema } from "@/core/ai/domain/schemas";
import type { AiPurpose, AiUsage } from "@/core/ai/domain/types";
import { db } from "@/server/drizzle/db";
import { aiUsage } from "@/server/drizzle/schemas/ai-usage-schema";

const logger = getLogger(["server", "ai"]);

/** Who to bill a call to in `ai_usage`. */
export interface UsageContext {
    purpose: AiPurpose;
    userId: string | null;
    referenceId: string | null;
}

interface CallOutcome {
    usage: {
        inputTokens: number | undefined;
        outputTokens: number | undefined;
    };
    providerMetadata: unknown;
}

export function toAiUsage(model: string, outcome: CallOutcome): AiUsage {
    const cost = gatewayCostMetadataSchema.safeParse(outcome.providerMetadata);
    return {
        model,
        inputTokens: outcome.usage.inputTokens ?? null,
        outputTokens: outcome.usage.outputTokens ?? null,
        costUsd: cost.success ? cost.data.gateway.cost : null,
    };
}

async function recordUsage(ctx: UsageContext, usage: AiUsage): Promise<void> {
    await db.insert(aiUsage).values({
        ...ctx,
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        costUsd: usage.costUsd?.toFixed(8) ?? null,
    });
}

/**
 * Models are AI Gateway ids ("google/gemini-2.5-flash"): switching provider
 * is an env change. Every call is recorded with its tokens and cost.
 */
export async function generate(params: {
    model: string;
    system: string;
    prompt: string;
    maxOutputTokens: number;
    usage: UsageContext;
}): Promise<string> {
    const result = await generateText({
        model: params.model,
        system: params.system,
        prompt: params.prompt,
        maxOutputTokens: params.maxOutputTokens,
    });
    await recordUsage(params.usage, toAiUsage(params.model, result));
    return result.text;
}

/**
 * Streams a chat turn; `onText` receives the full reply once it ends. Never
 * called when the model fails, so a failed turn leaves nothing behind.
 */
export function stream(params: {
    model: string;
    system: string;
    messages: ModelMessage[];
    maxOutputTokens: number;
    usage: UsageContext;
    onText: (text: string) => Promise<void>;
}) {
    const result = streamText({
        model: params.model,
        system: params.system,
        messages: params.messages,
        maxOutputTokens: params.maxOutputTokens,
        onError: ({ error }) => {
            logger.error("{purpose} stream failed: {error}", {
                purpose: params.usage.purpose,
                error,
            });
        },
        onFinish: async (event) => {
            // Billed first: the tokens were spent even if saving the reply fails.
            await recordUsage(params.usage, toAiUsage(params.model, event));
            await params.onText(event.text);
        },
    });
    // Keep reading if the browser disconnects, so the reply and its cost are still saved.
    result.consumeStream();
    return result;
}
