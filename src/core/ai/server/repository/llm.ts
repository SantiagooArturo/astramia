import "server-only";
import { getLogger } from "@logtape/logtape";
import {
    generateText,
    type ModelMessage,
    Output,
    smoothStream,
    streamText,
} from "ai";
import type { z } from "zod";
import { ServerConfig } from "@/config/server-config";
import type {
    AiReasoning,
    AiUsage,
    AiUsageContext,
} from "@/core/ai/domain/types";
import { toAiUsage } from "@/core/ai/domain/usage";
import { db } from "@/server/drizzle/db";
import { aiUsage } from "@/server/drizzle/schemas/ai-usage-schema";

const logger = getLogger(["server", "ai"]);

/** Lets the Gateway retry a failed call on the fallback model. */
function withFallback(model: string) {
    const fallback = ServerConfig.ai.models.fallback;
    return fallback === model ? undefined : { gateway: { models: [fallback] } };
}

/**
 * On thinking models hidden reasoning is billed as output and counts against
 * `maxOutputTokens`: a budget sized for the text alone gets cut mid-sentence
 * (the paid reading once came back at ~70 words). Callers size both.
 */
function isCut(ctx: AiUsageContext, finishReason: string): boolean {
    if (finishReason !== "length") return false;
    logger.warn("{purpose} hit maxOutputTokens; text is cut", {
        purpose: ctx.purpose,
    });
    return true;
}

async function recordUsage(ctx: AiUsageContext, usage: AiUsage): Promise<void> {
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
    reasoning: AiReasoning;
    usage: AiUsageContext;
}): Promise<string> {
    const result = await generateText({
        model: params.model,
        system: params.system,
        prompt: params.prompt,
        maxOutputTokens: params.maxOutputTokens,
        reasoning: params.reasoning,
        providerOptions: withFallback(params.model),
    });
    await recordUsage(params.usage, toAiUsage(params.model, result));
    // A cut text is never shown or stored; callers' error paths retry.
    if (isCut(params.usage, result.finishReason))
        throw new Error(`${params.usage.purpose} was cut by maxOutputTokens`);
    return result.text;
}

/**
 * Like `generate`, for a typed object: the model fills `schema` (validated
 * by the SDK). Same fallback, usage record and cut check.
 */
export async function generateObject<T>(params: {
    model: string;
    system: string;
    prompt: string;
    schema: z.ZodType<T>;
    maxOutputTokens: number;
    reasoning: AiReasoning;
    usage: AiUsageContext;
}): Promise<T> {
    const result = await generateText({
        model: params.model,
        system: params.system,
        prompt: params.prompt,
        output: Output.object({ schema: params.schema }),
        maxOutputTokens: params.maxOutputTokens,
        reasoning: params.reasoning,
        providerOptions: withFallback(params.model),
    });
    await recordUsage(params.usage, toAiUsage(params.model, result));
    if (isCut(params.usage, result.finishReason))
        throw new Error(`${params.usage.purpose} was cut by maxOutputTokens`);
    return result.output as T;
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
    reasoning: AiReasoning;
    usage: AiUsageContext;
    onText: (text: string) => Promise<void>;
}) {
    const result = streamText({
        model: params.model,
        system: params.system,
        messages: params.messages,
        maxOutputTokens: params.maxOutputTokens,
        reasoning: params.reasoning,
        providerOptions: withFallback(params.model),
        // Models send text in bursts; word by word at an even pace reads
        // like someone speaking, not a page loading.
        experimental_transform: smoothStream({
            chunking: "word",
            delayInMs: 22,
        }),
        onError: ({ error }) => {
            logger.error("{purpose} stream failed: {error}", {
                purpose: params.usage.purpose,
                error,
            });
        },
        onFinish: async (event) => {
            // Billed first: the tokens were spent even if saving the reply fails.
            await recordUsage(params.usage, toAiUsage(params.model, event));
            // Already streamed to the browser: log it, keep the turn.
            isCut(params.usage, event.finishReason);
            await params.onText(event.text);
        },
    });
    // Keep reading if the browser disconnects, so the reply and its cost are still saved.
    result.consumeStream();
    return result;
}
