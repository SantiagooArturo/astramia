import type { LanguageModelUsage } from "ai";
import { gatewayCostMetadataSchema } from "./schemas";
import type { AiUsage } from "./types";

/** Tokens and USD cost of one call, as the AI Gateway reports them. */
export function toAiUsage(
    model: string,
    outcome: {
        usage: Pick<LanguageModelUsage, "inputTokens" | "outputTokens">;
        providerMetadata: unknown;
    },
): AiUsage {
    const cost = gatewayCostMetadataSchema.safeParse(outcome.providerMetadata);
    return {
        model,
        inputTokens: outcome.usage.inputTokens ?? null,
        outputTokens: outcome.usage.outputTokens ?? null,
        costUsd: cost.success ? cost.data.gateway.cost : null,
    };
}
